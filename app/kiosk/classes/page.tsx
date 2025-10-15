'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaClock, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Timetable, SchoolSchedule, ClassConfig, Student } from '@/lib/types';

export default function KioskClassesPage() {
  const [activeTab, setActiveTab] = useState<'timetable' | 'schedule' | 'info'>('timetable');
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [schedules, setSchedules] = useState<SchoolSchedule[]>([]);
  const [classConfig, setClassConfig] = useState<ClassConfig | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 시간표
      const timetableSnap = await getDocs(collection(db, 'timetable'));
      if (!timetableSnap.empty) {
        const timetableData = {
          id: timetableSnap.docs[0].id,
          ...timetableSnap.docs[0].data(),
          updatedAt: timetableSnap.docs[0].data().updatedAt?.toDate() || new Date(),
        } as Timetable;
        setTimetable(timetableData);
      }

      // 학사일정
      const scheduleSnap = await getDocs(collection(db, 'schoolSchedules'));
      const scheduleData = scheduleSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          eventName: data.eventName,
          startDate: data.startDate,
          endDate: data.endDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      }) as SchoolSchedule[];

      // startDate로 정렬
      scheduleData.sort((a, b) => {
        if (a.startDate < b.startDate) return -1;
        if (a.startDate > b.startDate) return 1;
        return 0;
      });

      setSchedules(scheduleData);

      // 학급 정보
      const configSnap = await getDocs(collection(db, 'classConfig'));
      if (!configSnap.empty) {
        const configData = {
          id: configSnap.docs[0].id,
          ...configSnap.docs[0].data(),
          updatedAt: configSnap.docs[0].data().updatedAt?.toDate() || new Date(),
        } as ClassConfig;
        setClassConfig(configData);
      }

      // 학생 수
      const studentsSnap = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      setStudents(studentsData);

      setLoading(false);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setLoading(false);
    }
  };

  const getTimetableCell = (day: string, period: number) => {
    if (!timetable || !timetable.schedule) return '-';
    const key = `${day}-${period}`;
    return timetable.schedule[key] || '-';
  };

  const getScheduleColor = (index: number) => {
    const colors = [
      { bg: 'bg-blue-50', border: 'border-blue-500' },
      { bg: 'bg-green-50', border: 'border-green-500' },
      { bg: 'bg-yellow-50', border: 'border-yellow-500' },
      { bg: 'bg-purple-50', border: 'border-purple-500' },
      { bg: 'bg-pink-50', border: 'border-pink-500' },
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      {/* 상단 바 */}
      <div className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">📚 학급 정보</h1>
        <Link
          href="/kiosk"
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
        >
          돌아가기
        </Link>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center space-x-2 px-8 py-5 font-bold text-lg transition ${
                activeTab === 'timetable'
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FaClock size={24} />
              <span>시간표</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center space-x-2 px-8 py-5 font-bold text-lg transition ${
                activeTab === 'schedule'
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FaCalendarAlt size={24} />
              <span>학사일정</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center space-x-2 px-8 py-5 font-bold text-lg transition ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FaInfoCircle size={24} />
              <span>학급 정보</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-10">
          {activeTab === 'timetable' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">📅 시간표</h2>

              {/* 시간표 */}
              <div className="bg-gray-50 rounded-lg p-8 overflow-x-auto">
                <div className="grid grid-cols-6 gap-4 min-w-max">
                  <div className="font-bold text-gray-700 text-center text-lg">교시</div>
                  <div className="font-bold text-gray-700 text-center text-lg">월</div>
                  <div className="font-bold text-gray-700 text-center text-lg">화</div>
                  <div className="font-bold text-gray-700 text-center text-lg">수</div>
                  <div className="font-bold text-gray-700 text-center text-lg">목</div>
                  <div className="font-bold text-gray-700 text-center text-lg">금</div>

                  {[1, 2, 3, 4, 5, 6].map((period) => (
                    <div key={`row-${period}`} className="contents">
                      <div className="text-center text-gray-600 font-bold text-lg py-4">
                        {period}교시
                      </div>
                      {['월', '화', '수', '목', '금'].map((day) => {
                        const subject = getTimetableCell(day, period);
                        return (
                          <div
                            key={`${day}-${period}`}
                            className={`rounded-lg p-4 text-center text-base font-semibold border-2 ${
                              subject === '-'
                                ? 'bg-white text-gray-400 border-gray-200'
                                : 'bg-blue-50 text-blue-700 border-blue-300'
                            }`}
                          >
                            {subject}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {!timetable && (
                <div className="mt-6 text-center text-gray-500 text-lg">
                  시간표가 등록되지 않았습니다.
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">📆 학사일정</h2>

              {/* 학사일정 목록 */}
              {schedules.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-xl">등록된 학사일정이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule, index) => {
                    const color = getScheduleColor(index);
                    return (
                      <div key={schedule.id} className={`${color.bg} border-l-4 ${color.border} p-6 rounded-lg`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-800 text-xl">📅 {schedule.eventName}</p>
                            <p className="text-base text-gray-600 mt-2">
                              {schedule.startDate}
                              {schedule.endDate && schedule.endDate !== schedule.startDate && ` ~ ${schedule.endDate}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">ℹ️ 학급 정보</h2>

              {/* 학급 정보 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">기본 정보</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">학교명:</span>
                      <span className="font-bold text-gray-800">
                        {classConfig?.schoolName || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">학년/반:</span>
                      <span className="font-bold text-gray-800">
                        {classConfig ? `${classConfig.grade}학년 ${classConfig.classNumber}반` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">담임교사:</span>
                      <span className="font-bold text-gray-800">
                        {classConfig?.teacherName || '선생님'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">학급 현황</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">전체 학생:</span>
                      <span className="font-bold text-gray-800">{students.length}명</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">등록된 학생:</span>
                      <span className="font-bold text-gray-800">{students.length}명</span>
                    </div>
                  </div>
                </div>

                {!classConfig && (
                  <div className="md:col-span-2 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
                    <p className="text-yellow-800 text-lg">
                      학급 정보가 등록되지 않았습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
