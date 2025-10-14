'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaClock, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Timetable, SchoolSchedule, ClassConfig, Student } from '@/lib/types';

export default function ClassesPage() {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">수업 관리</h1>
        <p className="text-gray-600">시간표, 학사일정, 학급 정보를 관리합니다.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex items-center space-x-2 px-6 py-4 font-semibold transition ${
              activeTab === 'timetable'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaClock />
            <span>시간표</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center space-x-2 px-6 py-4 font-semibold transition ${
              activeTab === 'schedule'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaCalendarAlt />
            <span>학사일정</span>
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center space-x-2 px-6 py-4 font-semibold transition ${
              activeTab === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaInfoCircle />
            <span>학급 정보</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-md p-8">
        {activeTab === 'timetable' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">시간표 관리</h2>
              <Link
                href="/admin/timetable"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                시간표 편집
              </Link>
            </div>
            <p className="text-gray-600 mb-6">
              요일별, 교시별 시간표를 등록하고 관리합니다.
            </p>

            {/* 시간표 미리보기 */}
            <div className="bg-gray-50 rounded-lg p-6 overflow-x-auto">
              <div className="grid grid-cols-6 gap-4 min-w-max">
                <div className="font-bold text-gray-700 text-center">교시</div>
                <div className="font-bold text-gray-700 text-center">월</div>
                <div className="font-bold text-gray-700 text-center">화</div>
                <div className="font-bold text-gray-700 text-center">수</div>
                <div className="font-bold text-gray-700 text-center">목</div>
                <div className="font-bold text-gray-700 text-center">금</div>

                {[1, 2, 3, 4, 5, 6].map((period) => (
                  <div key={`row-${period}`} className="contents">
                    <div className="text-center text-gray-600 font-medium">
                      {period}교시
                    </div>
                    {['월', '화', '수', '목', '금'].map((day) => {
                      const subject = getTimetableCell(day, period);
                      return (
                        <div
                          key={`${day}-${period}`}
                          className={`rounded-lg p-3 text-center text-sm font-medium border ${
                            subject === '-'
                              ? 'bg-white text-gray-400 border-gray-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
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
              <div className="mt-4 text-sm text-gray-500">
                💡 시간표를 등록하려면 &quot;시간표 편집&quot; 버튼을 클릭하세요.
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">학사일정 관리</h2>
              <Link
                href="/admin/school-schedule"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                일정 편집
              </Link>
            </div>
            <p className="text-gray-600 mb-6">
              학교 행사, 방학, 시험 기간 등의 학사일정을 관리합니다.
            </p>

            {/* 학사일정 목록 */}
            {schedules.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">등록된 학사일정이 없습니다.</p>
                <Link
                  href="/admin/school-schedule"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  일정 추가하기 →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule, index) => {
                  const color = getScheduleColor(index);
                  return (
                    <div key={schedule.id} className={`${color.bg} border-l-4 ${color.border} p-4 rounded-lg`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800">📅 {schedule.eventName}</p>
                          <p className="text-sm text-gray-600 mt-1">
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">학급 정보</h2>
              <Link
                href="/admin/class-config"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                정보 편집
              </Link>
            </div>
            <p className="text-gray-600 mb-6">
              학급의 기본 정보를 확인하고 수정합니다.
            </p>

            {/* 학급 정보 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">기본 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">학교명:</span>
                    <span className="font-semibold text-gray-800">
                      {classConfig?.schoolName || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">학년/반:</span>
                    <span className="font-semibold text-gray-800">
                      {classConfig ? `${classConfig.grade}학년 ${classConfig.classNumber}반` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">담임교사:</span>
                    <span className="font-semibold text-gray-800">
                      {classConfig?.teacherName || '선생님'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">학급 현황</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">전체 학생:</span>
                    <span className="font-semibold text-gray-800">{students.length}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">등록된 학생:</span>
                    <span className="font-semibold text-gray-800">{students.length}명</span>
                  </div>
                </div>
              </div>

              {!classConfig && (
                <div className="md:col-span-2 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                  <p className="text-yellow-800">
                    💡 학급 정보를 등록하려면 &quot;정보 편집&quot; 버튼을 클릭하세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
