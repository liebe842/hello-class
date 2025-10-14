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

      const goalData: any = {
        studentId: student.id,
        studentName: student.name,
        title: goalTitle.trim(),
        targetCount: goalTargetCount,
        currentCount: 0,
        unit: '회',
        startDate: today,
        endDate: goalEndDate,
        checkDates: [],
        currentStreak: 0,
        longestStreak: 0,
        status: 'active',
        createdAt: Timestamp.now(),
      };

      // description이 있을 때만 추가
      if (goalDescription.trim()) {
        goalData.description = goalDescription.trim();
      }

      await addDoc(collection(db, 'studentGoals'), goalData);

      alert('목표가 생성되었습니다!');
      setShowGoalModal(false);
      setGoalTitle('');
      setGoalDescription('');
      setGoalTargetCount(10);
      setGoalEndDate('');

      fetchGoals(student.id);
    } catch (error) {
      console.error('목표 생성 실패:', error);
      alert('목표 생성에 실패했습니다.');
    } finally {
      setIsCreatingGoal(false);
    }
  };

  // 연속 달성 일수 계산
  const calculateStreak = (checkDates: string[], newDate: string): { currentStreak: number; longestStreak: number } => {
    const sortedDates = [...checkDates, newDate].sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = sortedDates.length - 1; i >= 0; i--) {
      if (i === sortedDates.length - 1) {
        // 최신 날짜부터 시작
        continue;
      }

      const currentDate = new Date(sortedDates[i + 1]);
      const prevDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // 연속된 날짜
        tempStreak++;
      } else {
        // 연속이 끊김
        if (i === sortedDates.length - 2) {
          // 현재 연속 기록
          currentStreak = tempStreak;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    // 마지막까지 연속된 경우
    if (tempStreak > 0) {
      currentStreak = tempStreak;
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak };
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

      // 연속 달성 계산
      const streakInfo = calculateStreak(goal.checkDates, today);
      const newCurrentStreak = streakInfo.currentStreak;
      const newLongestStreak = Math.max(goal.longestStreak || 0, streakInfo.longestStreak);

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
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        status: newStatus,
      });

      fetchGoals(student.id);
    } catch (error) {
      console.error('목표 체크 실패:', error);
      alert('체크에 실패했습니다.');
    }
  };

  const handleUncheckGoal = async (goal: StudentGoal) => {
    if (!student) return;

    const today = new Date().toISOString().split('T')[0];

    // 오늘 체크하지 않았으면 취소 불가
    if (!goal.checkDates.includes(today)) {
      alert('오늘 체크한 기록이 없습니다.');
      return;
    }

    if (!confirm('오늘의 체크를 취소하시겠습니까?')) return;

    try {
      const newCurrentCount = Math.max(0, goal.currentCount - 1);
      const newCheckDates = goal.checkDates.filter(date => date !== today);

      // 연속 달성 재계산
      let newCurrentStreak = 0;
      let newLongestStreak = goal.longestStreak || 0;

      if (newCheckDates.length > 0) {
        const sortedDates = [...newCheckDates].sort();
        let tempStreak = 1;
        let maxStreak = 1;

        for (let i = sortedDates.length - 1; i > 0; i--) {
          const currentDate = new Date(sortedDates[i]);
          const prevDate = new Date(sortedDates[i - 1]);
          const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak++;
          } else {
            if (i === sortedDates.length - 1) {
              newCurrentStreak = tempStreak;
            }
            maxStreak = Math.max(maxStreak, tempStreak);
            tempStreak = 1;
          }
        }

        newCurrentStreak = tempStreak;
        newLongestStreak = Math.max(maxStreak, tempStreak);
      }

      await updateDoc(doc(db, 'studentGoals', goal.id), {
        currentCount: newCurrentCount,
        checkDates: newCheckDates,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
      });

      fetchGoals(student.id);
    } catch (error) {
      console.error('체크 취소 실패:', error);
      alert('체크 취소에 실패했습니다.');
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
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-800 text-2xl">로딩 중...</div>
      </div>
    );
  }

  if (!student) return null;

  // 진행중/완료/실패로 분류
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const failedGoals = goals.filter(g => g.status === 'failed');

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🎯 나의 목표</h1>
      </div>

      {/* 메인 */}
      <main>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🔥 진행 중인 목표</h2>
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-800">{goal.title}</h3>
                          {(goal.currentStreak || 0) > 0 && (
                            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                              🔥 {goal.currentStreak}일 연속
                            </span>
                          )}
                        </div>
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
                          {(goal.longestStreak || 0) > 0 && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-orange-600 text-xs font-semibold">
                                최장 {goal.longestStreak}일
                              </span>
                            </>
                          )}
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
                      onClick={() => canCheckToday ? handleCheckGoal(goal) : handleUncheckGoal(goal)}
                      className={`w-full py-3 rounded-lg font-semibold transition ${
                        canCheckToday
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 완료한 목표</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedGoals.map(goal => (
                <div key={goal.id} className="bg-gradient-to-br from-green-100 to-teal-100 rounded-xl shadow-lg p-6 border-2 border-green-400">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{goal.title}</h3>
                      {(goal.longestStreak || 0) > 0 && (
                        <div className="flex items-center gap-1 text-sm mb-2">
                          <span className="text-orange-600 font-semibold">🔥 최고 기록:</span>
                          <span className="text-orange-700 font-bold">{goal.longestStreak}일 연속</span>
                        </div>
                      )}
                    </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800"
                  rows={2}
                  placeholder="목표에 대한 간단한 설명..."
                />
              </div>

              {/* 목표 횟수와 마감일 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    목표 횟수 *
                  </label>
                  <input
                    type="number"
                    value={goalTargetCount}
                    onChange={(e) => setGoalTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    마감일 *
                  </label>
                  <input
                    type="date"
                    value={goalEndDate}
                    onChange={(e) => setGoalEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-800"
                    required
                  />
                </div>
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
