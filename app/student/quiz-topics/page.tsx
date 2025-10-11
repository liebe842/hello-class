'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { QuizTopic, QuizAttempt } from '@/lib/types';

export default function StudentQuizTopicsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<QuizTopic[]>([]);
  const [quizCounts, setQuizCounts] = useState<{ [key: string]: number }>({});
  const [myQuizCounts, setMyQuizCounts] = useState<{ [key: string]: number }>({});
  const [myAttempts, setMyAttempts] = useState<{ [key: string]: QuizAttempt }>({});
  const [loading, setLoading] = useState(true);

  // 로컬스토리지에서 학생 정보 가져오기
  const studentData = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('studentSession') || '{}')
    : {};

  useEffect(() => {
    if (!studentData.id) {
      alert('로그인이 필요합니다.');
      router.push('/student/login');
      return;
    }
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      // 활성화된 주제만 가져오기
      const q = query(collection(db, 'quizTopics'), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      const topicsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as QuizTopic[];

      // 마감일 기준으로 정렬 (임박한 순)
      topicsData.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      setTopics(topicsData);

      // 각 주제별 통계 가져오기
      await Promise.all(topicsData.map(topic => fetchTopicStats(topic.id)));

      setLoading(false);
    } catch (err) {
      console.error('주제 목록 불러오기 실패:', err);
      setLoading(false);
    }
  };

  const fetchTopicStats = async (topicId: string) => {
    try {
      // 전체 퀴즈 수
      const quizzesQuery = query(collection(db, 'quizzes'), where('topicId', '==', topicId));
      const quizzesSnapshot = await getDocs(quizzesQuery);
      setQuizCounts(prev => ({ ...prev, [topicId]: quizzesSnapshot.size }));

      // 내가 만든 퀴즈 수
      const myQuizzesQuery = query(
        collection(db, 'quizzes'),
        where('topicId', '==', topicId),
        where('createdBy', '==', studentData.id)
      );
      const myQuizzesSnapshot = await getDocs(myQuizzesQuery);
      setMyQuizCounts(prev => ({ ...prev, [topicId]: myQuizzesSnapshot.size }));

      // 내 최고 점수
      const attemptsQuery = query(
        collection(db, 'quizAttempts'),
        where('topicId', '==', topicId),
        where('studentId', '==', studentData.id)
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);

      if (!attemptsSnapshot.empty) {
        const attempts = attemptsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          completedAt: doc.data().completedAt?.toDate(),
        })) as QuizAttempt[];

        // 최고 점수 찾기
        const bestAttempt = attempts.reduce((best, current) =>
          current.score > best.score ? current : best
        );
        setMyAttempts(prev => ({ ...prev, [topicId]: bestAttempt }));
      }
    } catch (err) {
      console.error('주제 통계 불러오기 실패:', err);
    }
  };

  const getTopicStatus = (topic: QuizTopic) => {
    const now = new Date();
    const daysUntilDue = Math.ceil((topic.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (now > topic.dueDate) {
      return { text: '마감됨', color: 'bg-gray-100 text-gray-700', emoji: '⏰' };
    } else if (daysUntilDue <= 1) {
      return { text: '오늘 마감', color: 'bg-red-100 text-red-700', emoji: '🔥' };
    } else if (daysUntilDue <= 3) {
      return { text: `${daysUntilDue}일 남음`, color: 'bg-orange-100 text-orange-700', emoji: '⚠️' };
    } else if (daysUntilDue <= 7) {
      return { text: `${daysUntilDue}일 남음`, color: 'bg-yellow-100 text-yellow-700', emoji: '📅' };
    } else {
      return { text: `${daysUntilDue}일 남음`, color: 'bg-green-100 text-green-700', emoji: '✅' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-purple-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">퀴즈 주제</h1>
            <p className="text-purple-100 text-sm mt-1">{studentData.name} 학생</p>
          </div>
          <Link
            href="/student/dashboard"
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            대시보드
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">퀴즈 주제</span>에 들어가서 문제를 만들고, 친구들이 만든 문제를 풀어보세요!
              </p>
            </div>
          </div>
        </div>

        {/* 주제 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              아직 활성화된 퀴즈 주제가 없습니다.
            </div>
          ) : (
            topics.map((topic) => {
              const status = getTopicStatus(topic);
              const totalQuizzes = quizCounts[topic.id] || 0;
              const myQuizzes = myQuizCounts[topic.id] || 0;
              const myBestAttempt = myAttempts[topic.id];

              return (
                <Link key={topic.id} href={`/student/quiz-topics/${topic.id}`}>
                  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                    {/* 상단 배지 */}
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {topic.subject}
                      </span>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}>
                        {status.emoji} {status.text}
                      </span>
                    </div>

                    {/* 제목 & 설명 */}
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {topic.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {topic.description || '선생님이 낸 주제로 퀴즈를 만들어보세요!'}
                    </p>

                    {/* 기간 */}
                    <div className="text-xs text-gray-500 mb-4 space-y-1">
                      <div>📅 시작: {topic.startDate.toLocaleDateString('ko-KR')}</div>
                      <div>⏰ 마감: {topic.dueDate.toLocaleDateString('ko-KR')}</div>
                    </div>

                    {/* 통계 */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">전체 퀴즈</span>
                        <span className="font-semibold text-purple-600">{totalQuizzes}개</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">내가 출제한 퀴즈</span>
                        <span className="font-semibold text-blue-600">
                          {myQuizzes}/{topic.maxQuizzesPerStudent}개
                        </span>
                      </div>
                      {myBestAttempt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">내 최고 점수</span>
                          <span className="font-semibold text-green-600">
                            {myBestAttempt.score}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 진행 상황 바 */}
                    {myQuizzes < topic.maxQuizzesPerStudent && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(myQuizzes / topic.maxQuizzesPerStudent) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {topic.maxQuizzesPerStudent - myQuizzes}개 더 만들 수 있어요!
                        </p>
                      </div>
                    )}
                    {myQuizzes >= topic.maxQuizzesPerStudent && (
                      <div className="mt-4 text-sm text-green-600 font-semibold">
                        ✅ 출제 완료!
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
