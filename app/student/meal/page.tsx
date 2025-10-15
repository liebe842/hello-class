'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Meal {
  date: string;
  mealName: string;
  dishName: string;
  calInfo: string;
}

export default function StudentMealPage() {
  const [loading, setLoading] = useState(true);
  const [weekMeals, setWeekMeals] = useState<{[key: string]: Meal[]}>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWeekMeals();
  }, []);

  const fetchWeekMeals = async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0: 일, 1: 월, ..., 6: 토
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // 이번 주 월요일

      const meals: {[key: string]: Meal[]} = {};

      // 이번 주 + 다음 주 월~금 급식 가져오기 (평일만, 총 10일)
      // 월요일부터 시작해서 평일만 10일 가져오기
      let weekdaysAdded = 0;
      let offset = 0;

      while (weekdaysAdded < 10) {
        const date = new Date(thisMonday);
        date.setDate(thisMonday.getDate() + offset);

        const day = date.getDay();

        // 평일(월~금)인 경우만 API 요청
        if (day >= 1 && day <= 5) {
          const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

          const response = await fetch(`/api/neis/meal?date=${dateStr}`);
          const data = await response.json();

          if (data.meals && data.meals.length > 0) {
            meals[dateStr] = data.meals;
          }

          weekdaysAdded++;
        }

        offset++;
      }

      setWeekMeals(meals);
      setLoading(false);
    } catch (err) {
      console.error('급식 정보 로드 실패:', err);
      setError('급식 정보를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${month}/${day} (${days[date.getDay()]})`;
  };

  const formatDishName = (dishName: string) => {
    // <br/> 태그를 줄바꿈으로 변환하고 알레르기 정보 제거
    return dishName
      .replace(/<br\/>/g, '\n')
      .replace(/\([0-9.]+\)/g, '') // 알레르기 번호 제거
      .trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">🍽️ 급식</h1>
          <Link
            href="/student"
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← 돌아가기
          </Link>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              관리자에게 NEIS API 설정을 확인하도록 요청하세요.
            </p>
          </div>
        )}

        {/* 이번 주 급식 */}
        {Object.keys(weekMeals).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500 text-lg">등록된 급식 정보가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(weekMeals).map(([date, meals]) => {
              // 한국 시간 기준 오늘 날짜
              const now = new Date();
              const todayFormatted = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
              const isToday = date === todayFormatted;

              return (
                <div
                  key={date}
                  className={`
                    bg-white rounded-2xl shadow-lg p-6
                    ${isToday ? 'ring-4 ring-yellow-400' : ''}
                  `}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {formatDate(date)}
                    </h2>
                    {isToday && (
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                        오늘
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {meals.map((meal, idx) => (
                      <div key={idx} className="border-t pt-4 first:border-t-0 first:pt-0">
                        <h3 className="text-sm font-bold text-blue-600 mb-2">
                          {meal.mealName}
                        </h3>
                        <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                          {formatDishName(meal.dishName)}
                        </div>
                        {meal.calInfo && (
                          <p className="text-xs text-gray-500 mt-2">
                            {meal.calInfo}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
