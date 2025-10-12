'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { QuizAttempt, Quiz, QuizResult, QuizTopic } from '@/lib/types';

interface SubjectStats {
  subject: string;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalCorrect: number;
  totalQuestions: number;
}

export default function StudentStatisticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [topics, setTopics] = useState<QuizTopic[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);

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
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // 내 시도 기록
      const attemptsQ = query(
        collection(db, 'quizAttempts'),
        where('studentId', '==', studentData.id)
      );
      const attemptsSnapshot = await getDocs(attemptsQ);
      const attemptsData = attemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as QuizAttempt[];

      // 내가 만든 퀴즈
      const quizzesQ = query(
        collection(db, 'quizzes'),
        where('createdBy', '==', studentData.id)
      );
      const quizzesSnapshot = await getDocs(quizzesQ);
      const quizzesData = quizzesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Quiz[];

      // 내 풀이 결과
      const resultsQ = query(
        collection(db, 'quizResults'),
        where('studentId', '==', studentData.id)
      );
      const resultsSnapshot = await getDocs(resultsQ);
      const resultsData = resultsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        answeredAt: doc.data().answeredAt?.toDate(),
      })) as QuizResult[];

      // 모든 주제
      const topicsSnapshot = await getDocs(collection(db, 'quizTopics'));
      const topicsData = topicsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as QuizTopic[];

      // 과목별 통계 계산
      const subjectMap = new Map<string, SubjectStats>();

      for (const topic of topicsData) {
        const topicAttempts = attemptsData.filter(a => a.topicId === topic.id);

        if (topicAttempts.length > 0) {
          const existing = subjectMap.get(topic.subject) || {
            subject: topic.subject,
            totalAttempts: 0,
            averageScore: 0,
            bestScore: 0,
            totalCorrect: 0,
            totalQuestions: 0,
          };

          existing.totalAttempts += topicAttempts.length;
          existing.totalCorrect += topicAttempts.reduce((sum, a) => sum + a.correctAnswers, 0);
          existing.totalQuestions += topicAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
          existing.bestScore = Math.max(existing.bestScore, ...topicAttempts.map(a => a.score));

          subjectMap.set(topic.subject, existing);
        }
      }

      // 평균 점수 계산
      const stats = Array.from(subjectMap.values()).map(stat => ({
        ...stat,
        averageScore: stat.totalQuestions > 0
          ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100)
          : 0,
      }));

      setAttempts(attemptsData);
      setMyQuizzes(quizzesData);
      setResults(resultsData);
      setTopics(topicsData);
      setSubjectStats(stats);
      setLoading(false);
    } catch (err) {
      console.error('통계 불러오기 실패:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  const totalAttempts = attempts.length;
  const averageScore = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
    : 0;
  const bestScore = totalAttempts > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
  const totalQuizzesCreated = myQuizzes.length;
  const verifiedQuizzes = myQuizzes.filter(q => q.isVerified).length;
  const totalAnswered = results.length;
  const totalCorrect = results.filter(r => r.isCorrect).length;

  // 최근 5개 시도
  const recentAttempts = [...attempts]
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">📊 내 통계</h1>
            <p className="text-blue-100 text-sm mt-1">{studentData.name}님의 학습 통계</p>
          </div>
          <Link
            href="/student/dashboard"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            대시보드
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 전체 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">총 도전 횟수</div>
            <div className="text-3xl font-bold text-blue-600">{totalAttempts}회</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">평균 점수</div>
            <div className="text-3xl font-bold text-green-600">{averageScore}점</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">최고 점수</div>
            <div className="text-3xl font-bold text-orange-600">{bestScore}점</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">만든 퀴즈</div>
            <div className="text-3xl font-bold text-purple-600">{totalQuizzesCreated}개</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 과목별 통계 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📚 과목별 성적</h2>
            {subjectStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 풀어본 퀴즈가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {subjectStats.map(stat => (
                  <div key={stat.subject} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-gray-800">{stat.subject}</div>
                      <div className="text-2xl font-bold text-blue-600">{stat.averageScore}점</div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>도전 {stat.totalAttempts}회</span>
                      <span>최고 {stat.bestScore}점</span>
                    </div>
                    {/* 진행 바 */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${stat.averageScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 퀴즈 제작 통계 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">✏️ 퀴즈 제작 통계</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">총 제작 퀴즈</div>
                  <div className="text-2xl font-bold text-purple-600">{totalQuizzesCreated}개</div>
                </div>
                <div className="text-4xl">📝</div>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">검증된 퀴즈</div>
                  <div className="text-2xl font-bold text-green-600">{verifiedQuizzes}개</div>
                </div>
                <div className="text-4xl">✅</div>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">검증 비율</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {totalQuizzesCreated > 0
                      ? Math.round((verifiedQuizzes / totalQuizzesCreated) * 100)
                      : 0}%
                  </div>
                </div>
                <div className="text-4xl">🎯</div>
              </div>

              {/* 난이도별 제작 현황 */}
              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">난이도별 제작</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">🟢 쉬움</span>
                    <span className="font-bold text-green-600">
                      {myQuizzes.filter(q => q.difficulty === 'easy').length}개
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">🟡 보통</span>
                    <span className="font-bold text-yellow-600">
                      {myQuizzes.filter(q => q.difficulty === 'medium').length}개
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">🔴 어려움</span>
                    <span className="font-bold text-red-600">
                      {myQuizzes.filter(q => q.difficulty === 'hard').length}개
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 도전 기록 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🕐 최근 도전 기록</h2>
          {recentAttempts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 도전 기록이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map(attempt => {
                const topic = topics.find(t => t.id === attempt.topicId);
                return (
                  <div key={attempt.id} className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{topic?.title || '알 수 없는 주제'}</div>
                      <div className="text-sm text-gray-600">
                        {attempt.completedAt.toLocaleDateString('ko-KR')} {attempt.completedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        {' | '}
                        {attempt.mode === 'full' ? '전체 도전' : '랜덤 도전'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        attempt.score >= 90 ? 'text-green-600' :
                        attempt.score >= 70 ? 'text-blue-600' :
                        attempt.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {attempt.score}점
                      </div>
                      <div className="text-xs text-gray-600">
                        {attempt.correctAnswers}/{attempt.totalQuestions} 정답
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 전체 풀이 통계 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-md p-6 text-white">
          <h2 className="text-xl font-bold mb-4">🎯 전체 풀이 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-sm mb-1">총 풀이한 문제</div>
              <div className="text-3xl font-bold">{totalAnswered}개</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-sm mb-1">맞힌 문제</div>
              <div className="text-3xl font-bold">{totalCorrect}개</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="text-sm mb-1">정답률</div>
              <div className="text-3xl font-bold">
                {totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
