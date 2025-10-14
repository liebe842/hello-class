'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Webcam from 'react-webcam';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { Student, Attendance, EmotionType, StudentGoal } from '@/lib/types';

// 타입 정의
interface ScheduleEvent {
  id: string;
  eventName: string;
  startDate: string;
  endDate?: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: Date;
  description?: string;
}

interface MealData {
  id: string;
  date: string;
  menu: string[];
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  // 대시보드에 표시할 추가 정보
  const [todaySchedule, setTodaySchedule] = useState<ScheduleEvent[]>([]);
  const [todayMeal, setTodayMeal] = useState<MealData | null>(null);
  const [todayClasses, setTodayClasses] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeGoals, setActiveGoals] = useState<StudentGoal[]>([]);
  const [leaderboard, setLeaderboard] = useState<Student[]>([]);
  const [myRank, setMyRank] = useState<number>(0);

  useEffect(() => {
    // localStorage에서 학생 세션 확인
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.push('/student/login');
      return;
    }

    const studentData = JSON.parse(sessionData) as Student;
    setStudent(studentData);

    // 모든 데이터 불러오기
    const fetchAllData = async () => {
      try {
        // 로컬 시간 기준 오늘 날짜
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

        // 출석 데이터
        const attendanceRef = collection(db, 'attendance');
        const q = query(attendanceRef, where('studentId', '==', studentData.id));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().time?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Attendance[];
        setAttendanceData(data);

        // 학사일정 (오늘 + 앞으로 30일) - 더 많이 표시
        const scheduleSnap = await getDocs(collection(db, 'schoolSchedules'));
        const schedules = scheduleSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ScheduleEvent))
          .filter((schedule) => {
            const startDate = new Date(schedule.startDate);
            const endDate = schedule.endDate ? new Date(schedule.endDate) : startDate;
            const now = new Date();
            const monthLater = new Date();
            monthLater.setDate(monthLater.getDate() + 30);
            return (startDate <= monthLater && endDate >= now);
          })
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 5); // 5개까지 표시
        setTodaySchedule(schedules);

        // 시간표 (오늘) - 6교시까지 모두 표시
        const timetableSnap = await getDocs(collection(db, 'timetable'));
        if (!timetableSnap.empty) {
          const timetableData = timetableSnap.docs[0].data();
          const schedule = timetableData.schedule || {};
          const classes = [];
          for (let period = 1; period <= 6; period++) {
            const key = `${dayOfWeek}-${period}`;
            if (schedule[key]) {
              classes.push(`${period}교시: ${schedule[key]}`);
            }
          }
          setTodayClasses(classes);
        }

        // 급식 (오늘) - NEIS API 호출 (평일만)
        const todayDay = new Date().getDay(); // 0: 일, 1: 월, ..., 6: 토
        if (todayDay >= 1 && todayDay <= 5) {
          try {
            const todayFormatted = today.replace(/-/g, ''); // YYYY-MM-DD → YYYYMMDD
            const mealResponse = await fetch(`/api/neis/meal?date=${todayFormatted}`);
            const mealData = await mealResponse.json();

            if (mealData.meals && mealData.meals.length > 0) {
              // 중식만 표시
              const lunch = mealData.meals.find((m: { mealName: string }) => m.mealName === '중식');
              if (lunch) {
                const menu = lunch.dishName
                  .replace(/<br\/>/g, '\n')
                  .replace(/\([0-9.]+\)/g, '')
                  .trim()
                  .split('\n')
                  .filter((item: string) => item.trim());

                setTodayMeal({
                  id: todayFormatted,
                  date: today,
                  menu
                });
              }
            }
          } catch (error) {
            console.error('급식 정보 가져오기 실패:', error);
          }
        }

        // 과제 (미제출 + 최근 마감 순)
        const assignmentsSnap = await getDocs(collection(db, 'assignments'));
        const assignmentsData = assignmentsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            dueDate: data.dueDate?.toDate() || new Date(),
            description: data.description,
          };
        });

        // 제출 기록 확인
        const submissionsRef = collection(db, 'assignmentSubmissions');
        const submissionsQuery = query(submissionsRef, where('studentId', '==', studentData.id));
        const submissionsSnap = await getDocs(submissionsQuery);
        const submittedIds = submissionsSnap.docs.map(doc => doc.data().assignmentId);

        // 미제출 과제만 필터링 (제출한 것만 제외, 마감일 지난 것도 표시)
        const pendingAssignments = assignmentsData
          .filter(a => !submittedIds.includes(a.id))
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
          .slice(0, 5) as Assignment[]; // 5개까지 표시
        setAssignments(pendingAssignments);

        // 학생 목표 가져오기 (진행 중인 목표만)
        const goalsRef = collection(db, 'studentGoals');
        const goalsQuery = query(goalsRef, where('studentId', '==', studentData.id), where('status', '==', 'active'));
        const goalsSnap = await getDocs(goalsQuery);
        const goalsData = goalsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActiveGoals(goalsData);

        // 리더보드 데이터 가져오기 (포인트 기준 상위 5명)
        const studentsSnap = await getDocs(collection(db, 'students'));
        const allStudents = studentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[];

        // 포인트 기준으로 정렬
        const sortedStudents = allStudents.sort((a, b) => (b.points || 0) - (a.points || 0));
        setLeaderboard(sortedStudents.slice(0, 5));

        // 내 순위 찾기
        const myRankIndex = sortedStudents.findIndex(s => s.id === studentData.id);
        setMyRank(myRankIndex !== -1 ? myRankIndex + 1 : 0);

        setLoading(false);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
        setLoading(false);
      }
    };

    fetchAllData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('studentSession');
    router.push('/student/login');
  };

  // 감정 이모지 매핑
  const emotionEmojis: Record<EmotionType, string> = {
    happy: '😊',
    excited: '🤩',
    tired: '😫',
    bored: '😑',
    angry: '😠',
    sad: '😢',
    worried: '😰',
    sleepy: '😴',
    curious: '🤔',
  };

  const emotionLabels: Record<EmotionType, string> = {
    happy: '행복해요',
    excited: '신나요',
    tired: '피곤해요',
    bored: '지루해요',
    angry: '화나요',
    sad: '슬퍼요',
    worried: '걱정돼요',
    sleepy: '졸려요',
    curious: '궁금해요',
  };

  // 웹캠 사진 촬영
  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  // 오늘 출석 여부 확인
  const todayAttendance = attendanceData.find(a => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return a.date === todayStr;
  });

  // 출석 제출
  const handleSubmitAttendance = async () => {
    if (!selectedEmotion || !capturedImage || !student) {
      alert('감정을 선택하고 사진을 촬영해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      const timestamp = now.getTime();

      // 이미지 압축 (파일 크기 줄이기)
      const compressedImage = await new Promise<string>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = capturedImage;
      });

      // Firebase Storage에 사진 업로드
      const storageRef = ref(storage, `attendance/${dateString}/${student.id}_${timestamp}.jpg`);
      await uploadString(storageRef, compressedImage, 'data_url');
      const photoUrl = await getDownloadURL(storageRef);

      // Firestore에 출석 기록 저장
      await addDoc(collection(db, 'attendance'), {
        studentId: student.id,
        studentName: student.name,
        date: dateString,
        time: Timestamp.fromDate(now),
        emotion: selectedEmotion,
        photoUrl,
        showPhoto,
        createdAt: Timestamp.fromDate(now),
      });

      // 8시 40분 이전 출석 시 포인트 지급 (1P)
      const hour = now.getHours();
      const minute = now.getMinutes();
      const isEarly = hour < 8 || (hour === 8 && minute <= 40);

      if (isEarly) {
        await updateDoc(doc(db, 'students', student.id), {
          points: increment(1),
        });

        await addDoc(collection(db, 'pointHistory'), {
          studentId: student.id,
          studentName: student.name,
          type: 'earn',
          amount: 1,
          source: 'attendance',
          description: '출석 (8:40 이전)',
          createdAt: Timestamp.now(),
        });
      }

      alert(isEarly ? '출석이 완료되었습니다! 🎉 +1P (일찍 출석)' : '출석이 완료되었습니다!');
      setShowAttendanceModal(false);
      setSelectedEmotion(null);
      setCapturedImage(null);
      setShowPhoto(true);

      // 출석 데이터 새로고침
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, where('studentId', '==', student.id));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().time?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Attendance[];
      setAttendanceData(data);
      setSubmitting(false);
    } catch (error: unknown) {
      console.error('출석 제출 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`출석 제출에 실패했습니다.\n오류: ${errorMessage}\n\n잠시 후 다시 시도해주세요.`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-800 text-2xl">로딩 중...</div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  // 이번 달 출석 데이터
  const thisMonth = new Date().getMonth();
  const thisMonthAttendance = attendanceData.filter(
    att => new Date(att.date).getMonth() === thisMonth
  );

  // 출석률 계산 (이번 달 기준)
  const daysInMonth = new Date().getDate();
  const attendanceRate = daysInMonth > 0
    ? Math.round((thisMonthAttendance.length / daysInMonth) * 100)
    : 0;

  // 최근 감정 (최근 7일)
  const recentEmotions = attendanceData
    .slice(-7)
    .reverse()
    .map(att => att.emotion);

  return (
    <div className="p-8">
        {/* 상단 통합 헤더 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between gap-6">
            {/* 왼쪽: 인사말 */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                Hello, {student.name} 👋
              </h1>
              <p className="text-gray-600 text-sm">
                오늘도 좋은 하루 보내세요! 열심히 공부하고 즐거운 시간 되세요.
              </p>
            </div>

            {/* 오른쪽: 포인트 + 출석 */}
            <div className="flex items-stretch gap-4">
              {/* 포인트 카드 */}
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-md px-4 py-3 text-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">💎</div>
                  <div>
                    <p className="text-xs opacity-90">Point</p>
                    <p className="text-2xl font-bold">{student.points || 0} XP</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/student/points"
                    className="text-xs text-white font-medium hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition whitespace-nowrap border border-white border-opacity-40"
                  >
                    📊 내역
                  </Link>
                  <Link
                    href="/kiosk/shop"
                    className="text-xs text-white font-medium hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition whitespace-nowrap border border-white border-opacity-40"
                  >
                    🛒 상점
                  </Link>
                </div>
              </div>

              {/* 출석 버튼 */}
              <div className="flex flex-col justify-center">
                {todayAttendance ? (
                  <div className="bg-green-50 text-green-700 border-2 border-green-200 px-6 py-3 rounded-xl font-bold text-sm text-center">
                    <div>✅ 출석 완료</div>
                    <p className="text-xs text-gray-500 mt-1 font-normal">
                      오늘 {todayAttendance.time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAttendanceModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-md h-full"
                  >
                    📸 출석하기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 오늘의 정보 섹션 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">오늘의 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 오늘 수업 - 6교시 전체 표시 */}
            <Link href="/student/timetable">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 hover:shadow-md hover:border-cyan-300 transition cursor-pointer h-64 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">📚</div>
                  <h3 className="font-bold text-gray-800">오늘 수업</h3>
                </div>
                {todayClasses.length > 0 ? (
                  <div className="space-y-1 overflow-y-auto flex-1">
                    {todayClasses.map((cls, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        {cls}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">등록된 시간표가 없습니다</p>
                )}
              </div>
            </Link>

            {/* 다가오는 일정 - 날짜 포함 */}
            <Link href="/student/school-schedule">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 hover:shadow-md hover:border-teal-300 transition cursor-pointer h-64 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">📅</div>
                  <h3 className="font-bold text-gray-800">다가오는 일정</h3>
                </div>
                {todaySchedule.length > 0 ? (
                  <div className="space-y-1 overflow-y-auto flex-1">
                    {todaySchedule.map((schedule) => {
                      const date = new Date(schedule.startDate);
                      const dateStr = `${date.getMonth() + 1}.${date.getDate()}`;
                      return (
                        <p key={schedule.id} className="text-sm text-gray-700">
                          {schedule.eventName} ({dateStr})
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">예정된 일정이 없습니다</p>
                )}
              </div>
            </Link>

            {/* 오늘 급식 메뉴 */}
            <Link href="/student/meal">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md hover:border-yellow-300 transition cursor-pointer h-64 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">🍽️</div>
                  <h3 className="font-bold text-gray-800">오늘 급식</h3>
                </div>
                {todayMeal && todayMeal.menu.length > 0 ? (
                  <div className="space-y-1 overflow-y-auto flex-1">
                    {todayMeal.menu.map((item, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        • {item}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">오늘 급식 정보가 없습니다</p>
                )}
              </div>
            </Link>

            {/* 제출해야 할 과제 */}
            <Link href="/student/assignments">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:shadow-md hover:border-orange-300 transition cursor-pointer h-64 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">📝</div>
                  <h3 className="font-bold text-gray-800">제출해야 할 과제</h3>
                </div>
                {assignments.length > 0 ? (
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {assignments.map((assignment) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dueDate = new Date(assignment.dueDate);
                      dueDate.setHours(0, 0, 0, 0);
                      const isOverdue = dueDate < today;
                      const isToday = dueDate.getTime() === today.getTime();

                      return (
                        <div
                          key={assignment.id}
                          className={`text-sm p-2 rounded ${
                            isOverdue ? 'bg-red-100 border border-red-300' :
                            isToday ? 'bg-yellow-100 border border-yellow-300' :
                            'bg-white'
                          }`}
                        >
                          <p className={`font-medium ${isOverdue ? 'text-red-700' : 'text-gray-700'}`}>
                            {isOverdue && '⚠️ '}
                            {isToday && '🔥 '}
                            {assignment.title}
                          </p>
                          <p className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : isToday ? 'text-yellow-700 font-semibold' : 'text-gray-500'}`}>
                            마감: {assignment.dueDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            {isOverdue && ' (기한 초과)'}
                            {isToday && ' (오늘 마감)'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">제출해야 할 과제가 없습니다</p>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* 출석 기록 섹션 */}
        <div className="space-y-6">
          {/* 나의 목표 + 최근 감정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 나의 목표 */}
            <Link href="/student/goals">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <h3 className="text-xl font-bold mb-4 text-gray-800">🎯 나의 목표</h3>
                {activeGoals.length > 0 ? (
                  <div className="space-y-3">
                    {activeGoals.slice(0, 2).map((goal) => {
                      const progress = Math.round((goal.currentCount / goal.targetCount) * 100);
                      return (
                        <div key={goal.id} className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm font-semibold text-purple-800">{goal.title}</p>
                          <div className="mt-2 bg-purple-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-purple-600 mt-1">
                            {goal.currentCount}/{goal.targetCount} {goal.unit} ({progress}% 달성)
                          </p>
                        </div>
                      );
                    })}
                    {activeGoals.length > 2 && (
                      <p className="text-xs text-center text-gray-500 mt-2">
                        +{activeGoals.length - 2}개 더 보기
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm mb-2">설정된 목표가 없습니다</p>
                    <p className="text-xs text-purple-600">클릭하여 목표를 만들어보세요!</p>
                  </div>
                )}
              </div>
            </Link>

            {/* 최근 감정 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">😊 최근 감정</h3>
              {recentEmotions.length === 0 ? (
                <p className="text-gray-500">아직 출석 기록이 없습니다.</p>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {recentEmotions.map((emotion, index) => (
                    <div key={index} className="text-center">
                      <span className="text-4xl block">{emotionEmojis[emotion]}</span>
                      <span className="text-xs text-gray-500">{emotionLabels[emotion]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 나의 순위 + 리더보드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 나의 순위 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">🏆 나의 순위</h3>
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">전체 순위</p>
                      <p className="text-4xl font-bold text-orange-600">
                        {myRank > 0 ? `${myRank}위` : '-'}
                      </p>
                    </div>
                    <div className="text-5xl">
                      {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🏅'}
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-semibold mb-1">내 포인트</p>
                  <p className="text-3xl font-bold text-yellow-600">{student.points || 0} XP</p>
                </div>
              </div>
            </div>

            {/* 리더보드 */}
            <Link href="/student/leaderboard">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <h3 className="text-xl font-bold mb-4 text-gray-800">👑 리더보드</h3>
                {leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((student, index) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 text-center font-bold text-gray-700">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{student.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-yellow-600">{student.points || 0} XP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm">리더보드 정보가 없습니다</p>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* 출석 기록 테이블 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">📊 출석 기록</h3>
            {attendanceData.length === 0 ? (
              <p className="text-gray-500">출석 기록이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        날짜
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        시간
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        사진
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        감정
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData
                      .slice(-10)
                      .reverse()
                      .map((att) => (
                        <tr key={att.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-800">
                            {new Date(att.date).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {att.time.toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {att.photoUrl ? (
                              <Image
                                src={att.photoUrl}
                                alt="출석 사진"
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-lg object-cover mx-auto"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                                <span className="text-xl">👤</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-2xl">{emotionEmojis[att.emotion]}</span>
                            <span className="text-sm text-gray-600 ml-2">{emotionLabels[att.emotion]}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      {/* 출석 체크 모달 */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">📸 출석 체크</h3>

            {/* 단계 표시 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${selectedEmotion ? 'text-green-600' : 'text-blue-600'}`}>
                  1. 감정 선택 {selectedEmotion && '✓'}
                </span>
                <span className={`text-sm font-semibold ${capturedImage ? 'text-green-600' : 'text-gray-400'}`}>
                  2. 사진 촬영 {capturedImage && '✓'}
                </span>
              </div>
            </div>

            {/* 감정 선택 */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">오늘의 기분은 어떠세요?</h4>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(emotionEmojis) as EmotionType[]).map(emotion => (
                  <button
                    key={emotion}
                    onClick={() => setSelectedEmotion(emotion)}
                    className={`p-4 rounded-xl border-2 transition ${
                      selectedEmotion === emotion
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">{emotionEmojis[emotion]}</div>
                    <p className="text-sm font-medium text-gray-700">{emotionLabels[emotion]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 웹캠 */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">사진 촬영</h4>
              {!capturedImage ? (
                <div>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    mirrored={false}
                    className="w-full rounded-xl mb-4"
                  />
                  <button
                    onClick={capturePhoto}
                    disabled={!selectedEmotion}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📸 사진 촬영
                  </button>
                </div>
              ) : (
                <div>
                  <Image src={capturedImage} alt="촬영된 사진" width={800} height={600} className="w-full rounded-xl mb-4" />
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition"
                  >
                    🔄 다시 촬영
                  </button>
                </div>
              )}
            </div>

            {/* 사진 공개 여부 체크박스 */}
            <div className="mb-6">
              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                <input
                  type="checkbox"
                  checked={showPhoto}
                  onChange={(e) => setShowPhoto(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <div>
                  <p className="font-semibold text-gray-800">키오스크에 사진 공개</p>
                  <p className="text-sm text-gray-600">체크 해제 시 키오스크에 이름만 표시됩니다</p>
                </div>
              </label>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAttendanceModal(false);
                  setSelectedEmotion(null);
                  setCapturedImage(null);
                  setShowPhoto(true);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition"
              >
                취소
              </button>
              <button
                onClick={handleSubmitAttendance}
                disabled={!selectedEmotion || !capturedImage || submitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '출석 중...' : '출석 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
