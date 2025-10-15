'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface MealData {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export default function KioskPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentDay, setCurrentDay] = useState('');
  const [mealData, setMealData] = useState<MealData | null>(null);
  const [currentClass, setCurrentClass] = useState('');
  const [attendanceRate, setAttendanceRate] = useState({ present: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const day = days[now.getDay()];

    setCurrentDate(`${year}년 ${month}월 ${date}일`);
    setCurrentDay(day);

    fetchKioskData();
  }, []);

  const fetchKioskData = async () => {
    try {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0].replace(/-/g, '');

      // 오늘의 급식 가져오기 (NEIS API 사용)
      try {
        const response = await fetch(`/api/neis/meal?date=${dateString}`);
        const data = await response.json();
        if (data.meals && data.meals.length > 0) {
          // 점심 급식 찾기
          const lunchMeal = data.meals.find((m: any) => m.mealName === '중식');
          if (lunchMeal) {
            // 알레르기 정보 제거하고 간단하게 표시
            const dishes = lunchMeal.dishName
              .replace(/<br\/>/g, ', ')
              .replace(/\([0-9.]+\)/g, '')
              .trim();
            setMealData({ breakfast: '', lunch: dishes, dinner: '' });
          }
        }
      } catch (err) {
        console.error('급식 정보 로드 실패:', err);
      }

      // 현재 교시 계산 및 시간표 가져오기
      const currentPeriod = getCurrentPeriod();
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];

      if (currentPeriod > 0 && dayOfWeek !== '일' && dayOfWeek !== '토') {
        const timetableSnapshot = await getDocs(collection(db, 'timetable'));
        if (!timetableSnapshot.empty) {
          const timetableData = timetableSnapshot.docs[0].data();
          const schedule = timetableData.schedule || {};
          const key = `${dayOfWeek}-${currentPeriod}`;
          const subject = schedule[key];
          if (subject && subject !== '-') {
            setCurrentClass(`${currentPeriod}교시 - ${subject}`);
          } else {
            setCurrentClass('수업 없음');
          }
        } else {
          setCurrentClass('시간표 없음');
        }
      } else if (dayOfWeek === '일' || dayOfWeek === '토') {
        setCurrentClass('주말');
      } else {
        setCurrentClass('수업 전');
      }

      // 오늘 출석률 계산
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '==', dateString)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const studentsSnapshot = await getDocs(collection(db, 'students'));

      setAttendanceRate({
        present: attendanceSnapshot.size,
        total: studentsSnapshot.size
      });

      setLoading(false);
    } catch (error) {
      console.error('키오스크 데이터 로드 실패:', error);
      setLoading(false);
    }
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 60 + minute;

    // 교시별 시간 (분 단위)
    const periods = [
      { period: 1, start: 9 * 60, end: 9 * 60 + 50 },      // 09:00 - 09:50
      { period: 2, start: 10 * 60, end: 10 * 60 + 50 },    // 10:00 - 10:50
      { period: 3, start: 11 * 60, end: 11 * 60 + 50 },    // 11:00 - 11:50
      { period: 4, start: 12 * 60, end: 12 * 60 + 50 },    // 12:00 - 12:50
      { period: 5, start: 14 * 60, end: 14 * 60 + 50 },    // 14:00 - 14:50
      { period: 6, start: 15 * 60, end: 15 * 60 + 50 },    // 15:00 - 15:50
      { period: 7, start: 16 * 60, end: 16 * 60 + 50 },    // 16:00 - 16:50
    ];

    for (const p of periods) {
      if (time >= p.start && time < p.end) {
        return p.period;
      }
    }
    return 0; // 수업 시간 아님
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      {/* 상단 바 */}
      <div className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Hello, Class! 🎉</h1>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-sm text-gray-600">{currentDate || '로딩 중...'}</p>
            <p className="text-lg font-bold text-gray-800">{currentDay || '...'}</p>
          </div>
          <Link
            href="/"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            홈
          </Link>
        </div>
      </div>

      {/* 메인 메뉴 */}
      <main className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {/* 출석 현황 */}
          <Link href="/kiosk/attendance">
            <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all w-full">
              <div className="text-8xl mb-6">📊</div>
              <h2 className="text-3xl font-bold text-gray-800">출석 현황</h2>
            </button>
          </Link>

          {/* 과제체크 */}
          <Link href="/kiosk/assignments">
            <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all w-full">
              <div className="text-8xl mb-6">📝</div>
              <h2 className="text-3xl font-bold text-gray-800">과제체크</h2>
            </button>
          </Link>

          {/* 오늘의 퀴즈 */}
          <Link href="/student/quiz-topics?kiosk=true">
            <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all w-full">
              <div className="text-8xl mb-6">❓</div>
              <h2 className="text-3xl font-bold text-gray-800">오늘의 퀴즈</h2>
            </button>
          </Link>

          {/* 학급 정보 */}
          <Link href="/kiosk/classes">
            <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all w-full">
              <div className="text-8xl mb-6">📚</div>
              <h2 className="text-3xl font-bold text-gray-800">학급 정보</h2>
            </button>
          </Link>

          {/* 리더보드 */}
          <Link href="/student/leaderboard?kiosk=true">
            <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all w-full">
              <div className="text-8xl mb-6">🏆</div>
              <h2 className="text-3xl font-bold text-gray-800">리더보드</h2>
            </button>
          </Link>

          {/* 미니게임 */}
          <Link href="/kiosk/minigames">
            <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all w-full">
              <div className="text-8xl mb-6">🎮</div>
              <h2 className="text-3xl font-bold text-gray-800">미니게임</h2>
            </button>
          </Link>
        </div>
      </main>

      {/* 하단 정보 바 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-90 px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">오늘의 급식 (점심)</p>
            <p className="font-semibold text-gray-800">
              {loading ? '로딩 중...' : mealData?.lunch || '급식 정보 없음'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">현재 수업</p>
            <p className="font-semibold text-gray-800">
              {loading ? '로딩 중...' : currentClass || '수업 정보 없음'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">오늘 출석률</p>
            <p className="font-semibold text-green-600">
              {loading ? '로딩 중...' : `${attendanceRate.present}/${attendanceRate.total} (${attendanceRate.total > 0 ? Math.round((attendanceRate.present / attendanceRate.total) * 100) : 0}%)`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
