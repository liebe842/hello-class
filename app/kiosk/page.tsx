'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface MealData {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export default function KioskPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentDay, setCurrentDay] = useState('');
  const [mealData, setMealData] = useState<MealData | null>(null);
  const [todayClasses, setTodayClasses] = useState<string>('');
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
      // 서울 시간 기준으로 날짜 생성 (YYYYMMDD 형식)
      const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

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

      // 오늘 시간표 가져오기
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];

      if (dayOfWeek !== '일' && dayOfWeek !== '토') {
        const timetableSnapshot = await getDocs(collection(db, 'timetable'));
        if (!timetableSnapshot.empty) {
          const timetableData = timetableSnapshot.docs[0].data();
          const schedule = timetableData.schedule || {};

          // 오늘의 모든 교시 수업 가져오기 (1-6교시)
          const classes = [];
          for (let period = 1; period <= 6; period++) {
            const key = `${dayOfWeek}-${period}`;
            const subject = schedule[key];
            if (subject && subject !== '-') {
              classes.push(`${period}교시: ${subject}`);
            }
          }

          if (classes.length > 0) {
            setTodayClasses(classes.join(' / '));
          } else {
            setTodayClasses('수업 없음');
          }
        } else {
          setTodayClasses('시간표 없음');
        }
      } else {
        setTodayClasses('주말');
      }

      // 오늘 출석률 계산 - 모든 출석 데이터를 가져온 후 필터링
      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      const todayAttendance = attendanceSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.date === dateString;
      });
      const studentsSnapshot = await getDocs(collection(db, 'students'));

      setAttendanceRate({
        present: todayAttendance.length,
        total: studentsSnapshot.size
      });

      setLoading(false);
    } catch (error) {
      console.error('키오스크 데이터 로드 실패:', error);
      setLoading(false);
    }
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
          <div className="flex-1 max-w-xl">
            <p className="text-sm text-gray-600">오늘 시간표</p>
            <p className="font-semibold text-gray-800 text-sm">
              {loading ? '로딩 중...' : todayClasses || '시간표 없음'}
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
