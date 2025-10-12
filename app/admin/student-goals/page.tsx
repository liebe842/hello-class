'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { StudentGoal } from '@/lib/types';

export default function AdminStudentGoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<StudentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const goalsSnapshot = await getDocs(collection(db, 'studentGoals'));
      const goalsData = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as StudentGoal[];

      // 학생 이름순, 날짜순 정렬
      goalsData.sort((a, b) => {
        if (a.studentName !== b.studentName) {
          return a.studentName.localeCompare(b.studentName);
        }
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      });

      setGoals(goalsData);
      setLoading(false);
    } catch (error) {
      console.error('목표 불러오기 실패:', error);
      setLoading(false);
    }
  };

  // 진행률 계산
  const getProgress = (goal: StudentGoal) => {
    return Math.min(Math.round((goal.currentCount / goal.targetCount) * 100), 100);
  };

  // D-day 계산
  const getDday = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  // 필터링
  const filteredGoals = goals.filter(goal => {
    if (filterStatus === 'all') return true;
    return goal.status === filterStatus;
  });

  // 학생별로 그룹핑
  const groupedGoals = filteredGoals.reduce((acc, goal) => {
    if (!acc[goal.studentName]) {
      acc[goal.studentName] = [];
    }
    acc[goal.studentName].push(goal);
    return acc;
  }, {} as Record<string, StudentGoal[]>);

  // 통계
  const stats = {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.status === 'active').length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
    studentsWithGoals: Object.keys(groupedGoals).length,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎯 학생 목표 현황</h1>
          <Link
            href="/admin"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            돌아가기
          </Link>
        </div>
      </header>

      {/* 메인 */}
      <main className="container mx-auto px-6 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">전체 목표</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalGoals}개</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">진행 중</div>
            <div className="text-3xl font-bold text-purple-600">{stats.activeGoals}개</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">완료</div>
            <div className="text-3xl font-bold text-green-600">{stats.completedGoals}개</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">목표 설정 학생</div>
            <div className="text-3xl font-bold text-orange-600">{stats.studentsWithGoals}명</div>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'active'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              진행 중
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              완료
            </button>
          </div>
        </div>

        {/* 학생별 목표 */}
        {Object.keys(groupedGoals).length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <div className="text-xl text-gray-600">아직 목표를 설정한 학생이 없습니다.</div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedGoals).map(([studentName, studentGoals]) => (
              <div key={studentName} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  👤 {studentName}
                  <span className="ml-3 text-sm font-normal text-gray-500">
                    ({studentGoals.length}개 목표)
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentGoals.map(goal => {
                    const progress = getProgress(goal);
                    const dday = getDday(goal.endDate);

                    return (
                      <div
                        key={goal.id}
                        className={`border-2 rounded-lg p-4 ${
                          goal.status === 'completed'
                            ? 'border-green-300 bg-green-50'
                            : goal.status === 'active'
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 flex-1">{goal.title}</h4>
                          {goal.status === 'completed' && (
                            <span className="text-xl">🏆</span>
                          )}
                        </div>

                        {goal.description && (
                          <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
                        )}

                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-purple-600">{progress}%</span>
                            <span className="text-xs text-gray-600">
                              {goal.currentCount} / {goal.targetCount} {goal.unit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                goal.status === 'completed' ? 'bg-green-500' : 'bg-purple-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">
                            {goal.startDate} ~ {goal.endDate}
                          </span>
                          {goal.status === 'active' && (
                            <span className={`font-semibold ${dday > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-Day' : '마감'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
