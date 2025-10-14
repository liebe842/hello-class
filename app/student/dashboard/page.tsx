'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Webcam from 'react-webcam';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { Student, Attendance, EmotionType } from '@/lib/types';
import StudentSidebar from '@/components/StudentSidebar';

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
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];

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

        // 급식 (오늘)
        const mealSnap = await getDocs(collection(db, 'meals'));
        const todayMealData = mealSnap.docs
          .map(doc => ({
            id: doc.id,
            date: doc.data().date,
            menu: doc.data().menu || []
          }))
          .find(meal => meal.date === today);
        if (todayMealData) {
          setTodayMeal(todayMealData as MealData);
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

        // 미제출 과제만 필터링 (마감일이 지나지 않은 것만)
        const now = new Date();
        now.setHours(0, 0, 0, 0); // 오늘 00:00:00

        const pendingAssignments = assignmentsData
          .filter(a => {
            const dueDate = new Date(a.dueDate);
            dueDate.setHours(23, 59, 59, 999); // 마감일 23:59:59
            return !submittedIds.includes(a.id) && dueDate >= now;
          })
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
          .slice(0, 5) as Assignment[]; // 5개까지 표시
        setAssignments(pendingAssignments);

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
    const today = new Date().toISOString().split('T')[0];
    return a.date === today;
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <StudentSidebar studentName={student.name} studentInitial={student.name[0]} />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 lg:ml-64 p-8">
        {/* 상단 인사말 & 포인트 */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Hello, {student.name} 👋
            </h1>
            <p className="text-gray-600">
              오늘도 좋은 하루 보내세요! 열심히 공부하고 즐거운 시간 되세요.
            </p>
          </div>

          {/* 우측 상단: 포인트 & 로그아웃 */}
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="text-4xl">💎</div>
                <div>
                  <p className="text-sm opacity-90">Point</p>
                  <p className="text-3xl font-bold">{student.points || 0} XP</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link
                  href="/student/points"
                  className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg transition"
                >
                  내역
                </Link>
                <Link
                  href="/kiosk/shop"
                  className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg transition"
                >
                  상점
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition text-sm shadow-md"
              >
                홈으로
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm shadow-md"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* 학생 정보 & 출석 카드 */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                {student.name[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{student.name}</h2>
                <p className="text-gray-600">
                  {student.grade}학년 {student.class}반 {student.number}번
                </p>
              </div>
            </div>

            {/* 출석 버튼 */}
            <div>
              {todayAttendance ? (
                <div className="text-center">
                  <div className="bg-green-50 text-green-700 border-2 border-green-200 px-8 py-4 rounded-xl font-bold text-lg">
                    ✅ 출석 완료
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {todayAttendance.time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-md"
                >
                  📸 출석하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 오늘의 정보 섹션 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">오늘의 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 오늘 수업 - 6교시 전체 표시 */}
            <Link href="/student/timetable">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 hover:shadow-md hover:border-cyan-300 transition cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">📚</div>
                  <h3 className="font-bold text-gray-800">오늘 수업</h3>
                </div>
                {todayClasses.length > 0 ? (
                  <div className="space-y-1">
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
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 hover:shadow-md hover:border-teal-300 transition cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">📅</div>
                  <h3 className="font-bold text-gray-800">다가오는 일정</h3>
                </div>
                {todaySchedule.length > 0 ? (
                  <div className="space-y-1">
                    {todaySchedule.map((schedule) => {
                      const date = new Date(schedule.startDate);
                      const dateStr = `${date.getMonth() + 1}.${date.getDate()}`;
                      return (
                        <p key={schedule.id} className="text-sm text-gray-700 truncate">
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">🍽️</div>
                  <h3 className="font-bold text-gray-800">오늘 급식</h3>
                </div>
                {todayMeal && todayMeal.menu.length > 0 ? (
                  <div className="space-y-1">
                    {todayMeal.menu.slice(0, 4).map((item, idx) => (
                      <p key={idx} className="text-sm text-gray-700 truncate">
                        • {item}
                      </p>
                    ))}
                    {todayMeal.menu.length > 4 && (
                      <p className="text-xs text-gray-500">외 {todayMeal.menu.length - 4}개</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">오늘 급식 정보가 없습니다</p>
                )}
              </div>
            </Link>

            {/* 미제출 과제 */}
            <Link href="/student/assignments">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:shadow-md hover:border-orange-300 transition cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">📝</div>
                  <h3 className="font-bold text-gray-800">미제출 과제</h3>
                </div>
                {assignments.length > 0 ? (
                  <div className="space-y-1">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="text-sm">
                        <p className="text-gray-700 truncate font-medium">{assignment.title}</p>
                        <p className="text-xs text-gray-500">
                          마감: {assignment.dueDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">미제출 과제가 없습니다</p>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* 대시보드 정보 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 출석 현황 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">📅 출석 현황</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">이번 달 출석</span>
                <span className="font-bold text-green-600">{thisMonthAttendance.length}일</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">출석률</span>
                <span className="font-bold text-blue-600">{attendanceRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">전체 출석</span>
                <span className="font-bold text-purple-600">{attendanceData.length}일</span>
              </div>
            </div>
          </div>

          {/* 최근 감정 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">😊 최근 감정</h3>
            {recentEmotions.length === 0 ? (
              <p className="text-gray-500">아직 출석 기록이 없습니다.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {recentEmotions.map((emotion, index) => (
                  <span
                    key={index}
                    className="text-4xl"
                    title={`${index + 1}일 전`}
                  >
                    {emotionLabels[emotion]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 나의 출석 사진 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">📸 최근 출석 사진</h3>
            {attendanceData.length === 0 ? (
              <p className="text-gray-500">출석 사진이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {attendanceData
                  .slice(-3)
                  .reverse()
                  .map((att) => (
                    <div key={att.id} className="flex items-center gap-3">
                      {att.photoUrl ? (
                        <Image
                          src={att.photoUrl}
                          alt="출석 사진"
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {new Date(att.date).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-xs text-gray-600">
                          {emotionLabels[att.emotion]} {att.emotion}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 출석 통계 */}
          <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
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
                          <td className="px-4 py-3">
                            <span className="text-2xl">{emotionLabels[att.emotion]}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 나의 목표 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">🎯 나의 목표</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-semibold text-green-800">매일 출석하기</p>
                <div className="mt-2 bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
                <p className="text-xs text-green-600 mt-1">{attendanceRate}% 달성</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-800">
                  긍정적인 감정 유지하기
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  최근 7일간 감정 기록을 확인해보세요!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

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
