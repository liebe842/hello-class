'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  increment,
} from 'firebase/firestore';
import type { Student, StudentGoal } from '@/lib/types';

export default function StudentGoalsPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [goals, setGoals] = useState<StudentGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // 목표 생성 모달
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetCount, setGoalTargetCount] = useState(10);
  const [goalUnit, setGoalUnit] = useState('회');
  const [goalEndDate, setGoalEndDate] = useState('');
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.push('/student/login');
      return;
    }

    const studentData = JSON.parse(sessionData) as Student;
    setStudent(studentData);

    fetchGoals(studentData.id);
  }, [router]);

  const fetchGoals = async (studentId: string) => {
    try {
      const goalsRef = collection(db, 'studentGoals');
      const q = query(goalsRef, where('studentId', '==', studentId));
      const goalsSnapshot = await getDocs(q);

      const goalsData = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as StudentGoal[];

      // 날짜순 정렬
      goalsData.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

      setGoals(goalsData);
      setLoading(false);
    } catch (error) {
      console.error('목표 불러오기 실패:', error);
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!student || !goalTitle.trim() || !goalEndDate) {
      alert('목표 제목과 마감일을 입력해주세요.');
      return;
    }

    setIsCreatingGoal(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      const goalData: Omit<StudentGoal, 'id'> = {
        studentId: student.id,
        studentName: student.name,
        title: goalTitle.trim(),
        description: goalDescription.trim() || undefined,
        targetCount: goalTargetCount,
        currentCount: 0,
        unit: goalUnit,
        startDate: today,
        endDate: goalEndDate,
        checkDates: [],
        status: 'active',
        createdAt: Timestamp.now() as unknown as Date,
      };

      await addDoc(collection(db, 'studentGoals'), goalData);

      alert('목표가 생성되었습니다!');
      setShowGoalModal(false);
      setGoalTitle('');
      setGoalDescription('');
      setGoalTargetCount(10);
      setGoalUnit('회');
      setGoalEndDate('');

      fetchGoals(student.id);
    } catch (error) {
      console.error('목표 생성 실패:', error);
      alert('목표 생성에 실패했습니다.');
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleCheckGoal = async (goal: StudentGoal) => {
    if (!student) return;

    const today = new Date().toISOString().split('T')[0];

    // 이미 오늘 체크했는지 확인
    if (goal.checkDates.includes(today)) {
      alert('오늘은 이미 체크했습니다!');
      return;
    }

    try {
      const newCurrentCount = goal.currentCount + 1;
      const newCheckDates = [...goal.checkDates, today];
      let newStatus = goal.status;

      // 목표 달성 확인
      if (newCurrentCount >= goal.targetCount) {
        newStatus = 'completed';

        // 목표 달성 포인트 지급 (20P)
        await updateDoc(doc(db, 'students', student.id), {
          points: increment(20),
        });

        await addDoc(collection(db, 'pointHistory'), {
          studentId: student.id,
          studentName: student.name,
          type: 'earn',
          amount: 20,
          source: 'goal',
          description: `목표 달성: ${goal.title}`,
          createdAt: Timestamp.now(),
        });

        alert('🎉 목표를 달성했습니다! 축하합니다! 🎁 +20P');
      }

      await updateDoc(doc(db, 'studentGoals', goal.id), {
        currentCount: newCurrentCount,
        checkDates: newCheckDates,
        status: newStatus,
      });

      fetchGoals(student.id);
    } catch (error) {
      console.error('목표 체크 실패:', error);
      alert('체크에 실패했습니다.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('이 목표를 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'studentGoals', goalId));
      alert('목표가 삭제되었습니다.');
      if (student) fetchGoals(student.id);
    } catch (error) {
      console.error('목표 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
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
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    );
  }

  if (!student) return null;

  // 진행중/완료/실패로 분류
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const failedGoals = goals.filter(g => g.status === 'failed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500">
      {/* 헤더 */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🎯 나의 목표</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGoalModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              ➕ 새 목표 만들기
            </button>
            <Link
              href="/student/dashboard"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              대시보드로
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="container mx-auto px-6 py-8">
        {/* 안내 메시지 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">💡 목표 설정 팁</h2>
          <ul className="text-gray-700 space-y-1 text-sm">
            <li>• 작고 구체적인 목표부터 시작하세요</li>
            <li>• 매일 체크할 수 있는 목표가 좋습니다</li>
            <li>• 목표를 달성하면 배지를 획득할 수 있어요!</li>
          </ul>
        </div>

        {/* 진행 중인 목표 */}
        {activeGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🔥 진행 중인 목표</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeGoals.map(goal => {
                const progress = getProgress(goal);
                const dday = getDday(goal.endDate);
                const today = new Date().toISOString().split('T')[0];
                const canCheckToday = !goal.checkDates.includes(today);

                return (
                  <div key={goal.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`font-semibold ${dday > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-Day' : '마감'}
                          </span>
                          <span className="text-gray-500">
                            ~ {new Date(goal.endDate).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
                    </div>

                    {/* 진행률 바 */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-2xl font-bold text-purple-600">{progress}%</span>
                        <span className="text-sm text-gray-600">
                          {goal.currentCount} / {goal.targetCount} {goal.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* 체크 버튼 */}
                    <button
                      onClick={() => handleCheckGoal(goal)}
                      disabled={!canCheckToday}
                      className={`w-full py-3 rounded-lg font-semibold transition ${
                        canCheckToday
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canCheckToday ? '✅ 오늘 체크하기' : '✓ 오늘 완료!'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 완료한 목표 */}
        {completedGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🏆 완료한 목표</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedGoals.map(goal => (
                <div key={goal.id} className="bg-gradient-to-br from-green-100 to-teal-100 rounded-xl shadow-lg p-6 border-2 border-green-400">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{goal.title}</h3>
                    <span className="text-3xl">🎉</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {goal.targetCount}{goal.unit} 달성 완료!
                  </p>
                  <div className="text-xs text-gray-600">
                    {goal.startDate} ~ {goal.endDate}
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="mt-3 w-full py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm transition"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 목표가 없을 때 */}
        {goals.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">아직 목표가 없습니다</h3>
            <p className="text-gray-600 mb-6">첫 번째 목표를 만들어보세요!</p>
            <button
              onClick={() => setShowGoalModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-bold transition"
            >
              ➕ 목표 만들기
            </button>
          </div>
        )}
      </main>

      {/* 목표 생성 모달 */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">✨ 새 목표 만들기</h3>

            <div className="space-y-4">
              {/* 목표 제목 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  목표 제목 *
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="예: 매일 퀴즈 1개 만들기"
                  required
                />
              </div>

              {/* 목표 설명 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  목표 설명 (선택)
                </label>
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={2}
                  placeholder="목표에 대한 간단한 설명..."
                />
              </div>

              {/* 목표 횟수 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    목표 횟수 *
                  </label>
                  <input
                    type="number"
                    value={goalTargetCount}
                    onChange={(e) => setGoalTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    단위 *
                  </label>
                  <select
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="회">회</option>
                    <option value="일">일</option>
                    <option value="개">개</option>
                    <option value="권">권</option>
                    <option value="시간">시간</option>
                    <option value="페이지">페이지</option>
                  </select>
                </div>
              </div>

              {/* 마감일 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  마감일 *
                </label>
                <input
                  type="date"
                  value={goalEndDate}
                  onChange={(e) => setGoalEndDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGoalModal(false)}
                disabled={isCreatingGoal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
              >
                취소
              </button>
              <button
                onClick={handleCreateGoal}
                disabled={isCreatingGoal}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {isCreatingGoal ? '생성 중...' : '✨ 목표 만들기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
