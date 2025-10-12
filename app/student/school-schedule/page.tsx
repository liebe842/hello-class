'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { SchoolSchedule } from '@/lib/types';

export default function StudentSchoolSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<SchoolSchedule[]>([]);

  useEffect(() => {
    fetchSchedules().then(() => setLoading(false));
  }, []);

  const fetchSchedules = async () => {
    const snap = await getDocs(collection(db, 'schoolSchedules'));
    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as SchoolSchedule[];

    // 날짜순 정렬
    data.sort((a, b) => a.startDate.localeCompare(b.startDate));
    setSchedules(data);
  };

  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0];

  // 날짜 표시 포맷
  const formatDateRange = (startDate: string, endDate?: string) => {
    if (endDate) {
      return `${startDate} ~ ${endDate}`;
    }
    return startDate;
  };

  // 월별로 그룹화
  const schedulesByMonth = schedules.reduce((acc, schedule) => {
    const month = schedule.startDate.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(schedule);
    return acc;
  }, {} as Record<string, SchoolSchedule[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">📅 학사일정</h1>
          <Link
            href="/student"
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← 돌아가기
          </Link>
        </div>

        {/* 일정 목록 */}
        {schedules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500 text-lg">등록된 학사일정이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(schedulesByMonth).map(([month, monthSchedules]) => (
              <div key={month} className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {month.replace('-', '년 ')}월
                </h2>
                <div className="space-y-2">
                  {monthSchedules.map(schedule => {
                    const isPast = schedule.endDate ? schedule.endDate < today : schedule.startDate < today;
                    const isToday = schedule.startDate === today || (schedule.endDate && schedule.startDate <= today && schedule.endDate >= today);
                    const isFuture = schedule.startDate > today;

                    return (
                      <div
                        key={schedule.id}
                        className={`
                          flex items-center gap-4 p-4 rounded-lg border-2
                          ${isToday ? 'bg-yellow-50 border-yellow-400' : ''}
                          ${isFuture && !isToday ? 'bg-blue-50 border-blue-200' : ''}
                          ${isPast ? 'bg-gray-50 border-gray-200 opacity-60' : ''}
                        `}
                      >
                        <div className="flex-shrink-0">
                          <div className={`
                            text-center px-3 py-2 rounded-lg font-bold
                            ${isToday ? 'bg-yellow-400 text-white' : ''}
                            ${isFuture && !isToday ? 'bg-blue-400 text-white' : ''}
                            ${isPast ? 'bg-gray-300 text-gray-600' : ''}
                          `}>
                            <div className="text-xs">{schedule.startDate.substring(5, 7)}월</div>
                            <div className="text-2xl">{schedule.startDate.substring(8, 10)}</div>
                            {schedule.endDate && <div className="text-xs mt-1">~{schedule.endDate.substring(8, 10)}</div>}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className={`
                            text-lg font-medium
                            ${isToday ? 'text-yellow-800' : ''}
                            ${isFuture && !isToday ? 'text-blue-800' : ''}
                            ${isPast ? 'text-gray-500' : ''}
                          `}>
                            {schedule.eventName}
                            {isToday && <span className="ml-2 text-sm">🔔 진행 중</span>}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDateRange(schedule.startDate, schedule.endDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
