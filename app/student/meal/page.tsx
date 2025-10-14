'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Meal {
  date: string;
  menu: string[];
}

export default function StudentMealPage() {
  const [loading, setLoading] = useState(true);
  const [weekMeals, setWeekMeals] = useState<{[key: string]: Meal}>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWeekMeals();
  }, []);

  const fetchWeekMeals = async () => {
    try {
      // Firestore에서 직접 급식 데이터 가져오기
      const mealsSnap = await getDocs(collection(db, 'meals'));
      const meals: {[key: string]: Meal} = {};

      mealsSnap.docs.forEach(doc => {
        const data = doc.data();
        const dateStr = data.date.replace(/-/g, ''); // YYYY-MM-DD → YYYYMMDD
        meals[dateStr] = {
          date: data.date,
          menu: data.menu || []
        };
      });

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


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
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
            {Object.entries(weekMeals)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateStr, meal]) => {
                const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
                const isToday = dateStr === today;

                return (
                  <div
                    key={dateStr}
                    className={`
                      bg-white rounded-2xl shadow-lg p-6
                      ${isToday ? 'ring-4 ring-yellow-400' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-xl font-bold text-gray-800">
                        {formatDate(dateStr)}
                      </h2>
                      {isToday && (
                        <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                          오늘
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {meal.menu.map((item, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-sm text-gray-700">{item}</span>
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
