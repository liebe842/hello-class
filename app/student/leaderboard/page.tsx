'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { QuizAttempt, Quiz, Student } from '@/lib/types';

interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalQuizzes: number;
  verifiedQuizzes: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'scores' | 'quizzes'>('scores');
  const [scoreLeaderboard, setScoreLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizLeaderboard, setQuizLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 학생 정보
  const studentData = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('studentSession') || '{}')
    : {};

  useEffect(() => {
    if (!studentData.id) {
      alert('로그인이 필요합니다.');
      router.push('/student/login');
      return;
    }
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // 모든 학생 가져오기
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];

      // 모든 시도 기록 가져오기
      const attemptsSnapshot = await getDocs(collection(db, 'quizAttempts'));
      const attempts = attemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as QuizAttempt[];

      // 모든 퀴즈 가져오기
      const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
      const quizzes = quizzesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Quiz[];

      // 학생별 데이터 집계
      const leaderboardData: LeaderboardEntry[] = students.map(student => {
        const studentAttempts = attempts.filter(a => a.studentId === student.id);
        const studentQuizzes = quizzes.filter(q => q.createdBy === student.id);

        const totalAttempts = studentAttempts.length;
        const averageScore = totalAttempts > 0
          ? Math.round(studentAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
          : 0;
        const bestScore = totalAttempts > 0
          ? Math.max(...studentAttempts.map(a => a.score))
          : 0;
        const totalQuizzes = studentQuizzes.length;
        const verifiedQuizzes = studentQuizzes.filter(q => q.isVerified).length;

        return {
          studentId: student.id,
          studentName: student.name,
          totalAttempts,
          averageScore,
          bestScore,
          totalQuizzes,
          verifiedQuizzes,
        };
      });

      // 점수 순위 (평균 점수 기준)
      const scoreRanking = [...leaderboardData]
        .filter(entry => entry.totalAttempts > 0)
        .sort((a, b) => b.averageScore - a.averageScore);

      // 퀴즈 제작 순위 (검증된 퀴즈 수 기준)
      const quizRanking = [...leaderboardData]
        .filter(entry => entry.totalQuizzes > 0)
        .sort((a, b) => {
          if (b.verifiedQuizzes !== a.verifiedQuizzes) {
            return b.verifiedQuizzes - a.verifiedQuizzes;
          }
          return b.totalQuizzes - a.totalQuizzes;
        });

      setScoreLeaderboard(scoreRanking);
      setQuizLeaderboard(quizRanking);
      setLoading(false);
    } catch (err) {
      console.error('리더보드 불러오기 실패:', err);
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}위`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🏆 리더보드</h1>
        <p className="text-gray-600 text-sm mt-1">우리 반 최고는 누구?</p>
      </div>

      {/* 메인 콘텐츠 */}
      <main>
        {/* 탭 */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('scores')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'scores'
                  ? 'bg-yellow-50 text-yellow-600 border-b-2 border-yellow-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📊 점수 순위
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'quizzes'
                  ? 'bg-yellow-50 text-yellow-600 border-b-2 border-yellow-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              ✏️ 퀴즈 제작 순위
            </button>
          </div>

          <div className="p-6">
            {/* 점수 순위 탭 */}
            {activeTab === 'scores' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">평균 점수 순위</h2>
                  <p className="text-sm text-gray-600">
                    모든 퀴즈 도전의 평균 점수를 기준으로 한 순위입니다.
                  </p>
                </div>

                {scoreLeaderboard.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    아직 퀴즈를 푼 친구가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scoreLeaderboard.map((entry, index) => {
                      const isMe = entry.studentId === studentData.id;
                      return (
                        <div
                          key={entry.studentId}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                            isMe
                              ? 'bg-yellow-50 border-yellow-400'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold w-16 text-center">
                              {getRankBadge(index + 1)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 flex items-center gap-2">
                                {entry.studentName}
                                {isMe && (
                                  <span className="bg-yellow-400 text-white text-xs px-2 py-1 rounded">
                                    나
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                도전 {entry.totalAttempts}회 | 최고 {entry.bestScore}점
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-yellow-600">
                              {entry.averageScore}
                            </div>
                            <div className="text-xs text-gray-600">평균 점수</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 퀴즈 제작 순위 탭 */}
            {activeTab === 'quizzes' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">퀴즈 제작자 순위</h2>
                  <p className="text-sm text-gray-600">
                    선생님에게 검증받은 퀴즈 수를 기준으로 한 순위입니다.
                  </p>
                </div>

                {quizLeaderboard.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    아직 퀴즈를 만든 친구가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizLeaderboard.map((entry, index) => {
                      const isMe = entry.studentId === studentData.id;
                      return (
                        <div
                          key={entry.studentId}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                            isMe
                              ? 'bg-yellow-50 border-yellow-400'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold w-16 text-center">
                              {getRankBadge(index + 1)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 flex items-center gap-2">
                                {entry.studentName}
                                {isMe && (
                                  <span className="bg-yellow-400 text-white text-xs px-2 py-1 rounded">
                                    나
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                총 {entry.totalQuizzes}개 제작
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-3xl font-bold text-green-600">
                                  {entry.verifiedQuizzes}
                                </div>
                                <div className="text-xs text-gray-600">검증된 퀴즈</div>
                              </div>
                              {entry.verifiedQuizzes > 0 && (
                                <span className="text-3xl">✅</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 내 순위 요약 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-md p-6 text-white">
          <h3 className="text-xl font-bold mb-4">📌 내 순위</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-sm mb-1 text-purple-900">점수 순위</div>
              <div className="text-3xl font-bold text-purple-900">
                {scoreLeaderboard.findIndex(e => e.studentId === studentData.id) !== -1
                  ? `${scoreLeaderboard.findIndex(e => e.studentId === studentData.id) + 1}위`
                  : '-'}
              </div>
              <div className="text-xs mt-1 text-purple-800">
                {scoreLeaderboard.find(e => e.studentId === studentData.id)?.averageScore || 0}점 평균
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-sm mb-1 text-purple-900">퀴즈 제작 순위</div>
              <div className="text-3xl font-bold text-purple-900">
                {quizLeaderboard.findIndex(e => e.studentId === studentData.id) !== -1
                  ? `${quizLeaderboard.findIndex(e => e.studentId === studentData.id) + 1}위`
                  : '-'}
              </div>
              <div className="text-xs mt-1 text-purple-800">
                검증 {quizLeaderboard.find(e => e.studentId === studentData.id)?.verifiedQuizzes || 0}개
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
