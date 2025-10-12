'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Webcam from 'react-webcam';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { Student, Attendance, EmotionType } from '@/lib/types';

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

  useEffect(() => {
    // localStorage에서 학생 세션 확인
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.push('/student/login');
      return;
    }

    const studentData = JSON.parse(sessionData) as Student;
    setStudent(studentData);

    // 학생의 출석 데이터 불러오기
    const fetchAttendanceData = async () => {
      try {
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
        setLoading(false);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
        setLoading(false);
      }
    };

    fetchAttendanceData();
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

      // Firebase Storage에 사진 업로드
      const storageRef = ref(storage, `attendance/${dateString}/${student.id}_${timestamp}.jpg`);
      await uploadString(storageRef, capturedImage, 'data_url');
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

      alert('출석이 완료되었습니다!');
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
    } catch (error) {
      console.error('출석 제출 실패:', error);
      alert('출석 제출에 실패했습니다.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500">
      {/* 헤더 */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">나의 대시보드 📚</h1>
          <div className="flex gap-4">
            <Link
              href="/"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              홈으로
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 학생 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-4xl text-white font-bold">
                {student.name[0]}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{student.name}</h2>
                <p className="text-gray-600">
                  {student.grade}학년 {student.class}반 {student.number}번
                </p>
              </div>
            </div>

            {/* 출석 버튼 */}
            <div>
              {todayAttendance ? (
                <div className="text-center">
                  <div className="bg-green-100 text-green-700 px-8 py-4 rounded-xl font-bold text-lg">
                    ✅ 출석 완료
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {todayAttendance.time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition transform hover:scale-105"
                >
                  📸 출석하기
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 퀴즈 주제 바로가기 */}
          <Link href="/student/quiz-topics">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer text-white">
              <h3 className="text-xl font-bold mb-2">🎯 퀴즈 주제</h3>
              <p className="text-purple-100 text-sm mb-4">
                문제를 만들고 친구들의 문제를 풀어보세요!
              </p>
              <div className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 rounded-lg transition text-center">
                주제 보러가기 →
              </div>
            </div>
          </Link>
          {/* 리더보드 바로가기 */}
          <Link href="/student/leaderboard">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer text-white">
              <h3 className="text-xl font-bold mb-2">🏆 리더보드</h3>
              <p className="text-yellow-100 text-sm mb-4">
                우리 반 최고는 누구? 순위를 확인해보세요!
              </p>
              <div className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 rounded-lg transition text-center">
                순위 보러가기 →
              </div>
            </div>
          </Link>
          {/* 내 통계 바로가기 */}
          <Link href="/student/statistics">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer text-white">
              <h3 className="text-xl font-bold mb-2">📊 내 통계</h3>
              <p className="text-blue-100 text-sm mb-4">
                내 학습 기록과 성적을 확인해보세요!
              </p>
              <div className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 rounded-lg transition text-center">
                통계 보러가기 →
              </div>
            </div>
          </Link>
          {/* 배지 컬렉션 바로가기 */}
          <Link href="/student/badges">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer text-white">
              <h3 className="text-xl font-bold mb-2">🏅 배지 컬렉션</h3>
              <p className="text-yellow-100 text-sm mb-4">
                획득한 배지를 확인하고 새로운 목표에 도전하세요!
              </p>
              <div className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 rounded-lg transition text-center">
                배지 보러가기 →
              </div>
            </div>
          </Link>
          {/* 과제 바로가기 */}
          <Link href="/student/assignments">
            <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer text-white">
              <h3 className="text-xl font-bold mb-2">📝 과제</h3>
              <p className="text-green-100 text-sm mb-4">
                과제를 확인하고 제출해보세요!
              </p>
              <div className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 rounded-lg transition text-center">
                과제 보러가기 →
              </div>
            </div>
          </Link>

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
