'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Timetable } from '@/lib/types';

export default function StudentTimetablePage() {
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<{[key: string]: string}>({});

  const days = ['월', '화', '수', '목', '금'];
  const periods = [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    fetchTimetable().then(() => setLoading(false));
  }, []);

  const fetchTimetable = async () => {
    try {
      const snap = await getDocs(collection(db, 'timetable'));
      if (snap.docs.length > 0) {
        const data = snap.docs[0].data() as Omit<Timetable, 'id'>;
        setTimetable(data.schedule || {});
      }
    } catch (err) {
      console.error('시간표 불러오기 실패:', err);
    }
  };

  // 오늘 요일 (0: 일, 1: 월, ..., 5: 금)
  const todayIndex = new Date().getDay();
  const todayDay = todayIndex >= 1 && todayIndex <= 5 ? days[todayIndex - 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">📚 시간표</h1>
          <Link
            href="/student"
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← 돌아가기
          </Link>
        </div>

        {/* 시간표 */}
        {Object.keys(timetable).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500 text-lg">등록된 시간표가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {todayDay && (
              <p className="text-sm text-blue-600 mb-4 font-semibold">
                오늘은 {todayDay}요일입니다
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold">
                      교시
                    </th>
                    {days.map(day => (
                      <th
                        key={day}
                        className={`
                          border border-gray-300 px-4 py-3 text-center font-bold
                          ${todayDay === day ? 'bg-yellow-400 text-gray-900' : ''}
                        `}
                      >
                        {day}
                        {todayDay === day && <div className="text-xs mt-1">📌 오늘</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-4 text-center font-bold bg-gray-50 text-lg">
                        {period}
                      </td>
                      {days.map(day => {
                        const key = `${day}-${period}`;
                        const value = timetable[key] || '-';
                        const isToday = todayDay === day;

                        return (
                          <td
                            key={key}
                            className={`
                              border border-gray-300 px-4 py-4 text-center text-base
                              ${isToday ? 'bg-yellow-50 font-semibold text-yellow-900' : 'text-gray-700'}
                            `}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
