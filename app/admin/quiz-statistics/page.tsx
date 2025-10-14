'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { QuizAttempt, Quiz, QuizTopic, Student, QuizResult } from '@/lib/types';

interface StudentStats {
  studentId: string;
  studentName: string;
  totalAttempts: number;
  averageScore: number;
  totalQuizzesCreated: number;
  verifiedQuizzes: number;
  participationRate: number; // 참여율
}

interface TopicStats {
  topicId: string;
  topicTitle: string;
  subject: string;
  totalStudentsParticipated: number;
  totalAttempts: number;
  averageScore: number;
  totalQuizzesCreated: number;
  participationRate: number;
}

export default function AdminQuizStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [topics, setTopics] = useState<QuizTopic[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'topics'>('overview');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // 모든 데이터 가져오기
      const [studentsSnap, attemptsSnap, quizzesSnap, topicsSnap, resultsSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'quizAttempts')),
        getDocs(collection(db, 'quizzes')),
        getDocs(collection(db, 'quizTopics')),
        getDocs(collection(db, 'quizResults')),
      ]);

      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Student[];

      const attemptsData = attemptsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as QuizAttempt[];

      const quizzesData = quizzesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Quiz[];

      const topicsData = topicsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as QuizTopic[];

      const resultsData = resultsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        answeredAt: doc.data().answeredAt?.toDate(),
      })) as QuizResult[];

      // 학생별 통계 계산
      const studentStatsData = studentsData.map(student => {
        const studentAttempts = attemptsData.filter(a => a.studentId === student.id);
        const studentQuizzes = quizzesData.filter(q => q.createdBy === student.id);

        const totalAttempts = studentAttempts.length;
        const averageScore = totalAttempts > 0
          ? Math.round(studentAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
          : 0;
        const totalQuizzesCreated = studentQuizzes.length;
        const verifiedQuizzes = studentQuizzes.filter(q => q.isVerified).length;

        // 참여율: 활성 주제 중 몇 개에 참여했는지
        const activeTopics = topicsData.filter(t => t.isActive);
        const participatedTopics = new Set(studentAttempts.map(a => a.topicId));
        const participationRate = activeTopics.length > 0
          ? Math.round((participatedTopics.size / activeTopics.length) * 100)
          : 0;

        return {
          studentId: student.id,
          studentName: student.name,
          totalAttempts,
          averageScore,
          totalQuizzesCreated,
          verifiedQuizzes,
          participationRate,
        };
      });

      // 주제별 통계 계산
      const topicStatsData = topicsData.map(topic => {
        const topicAttempts = attemptsData.filter(a => a.topicId === topic.id);
        const topicQuizzes = quizzesData.filter(q => q.topicId === topic.id);

        const totalAttempts = topicAttempts.length;
        const averageScore = totalAttempts > 0
          ? Math.round(topicAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
          : 0;

        const participatedStudents = new Set(topicAttempts.map(a => a.studentId));
        const totalStudentsParticipated = participatedStudents.size;
        const participationRate = studentsData.length > 0
          ? Math.round((totalStudentsParticipated / studentsData.length) * 100)
          : 0;

        return {
          topicId: topic.id,
          topicTitle: topic.title,
          subject: topic.subject,
          totalStudentsParticipated,
          totalAttempts,
          averageScore,
          totalQuizzesCreated: topicQuizzes.length,
          participationRate,
        };
      });

      setStudents(studentsData);
      setAttempts(attemptsData);
      setQuizzes(quizzesData);
      setTopics(topicsData);
      setResults(resultsData);
      setStudentStats(studentStatsData);
      setTopicStats(topicStatsData);
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

  // 전체 통계
  const totalAttempts = attempts.length;
  const totalQuizzes = quizzes.length;
  const studentQuizzes = quizzes.filter(q => q.createdBy !== 'teacher');
  const verifiedQuizzes = studentQuizzes.filter(q => q.isVerified);
  const reportedQuizzes = quizzes.filter(q => q.reportCount > 0);
  const averageClassScore = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
    : 0;
  const activeTopics = topics.filter(t => t.isActive);
  const avgParticipationRate = studentStats.length > 0
    ? Math.round(studentStats.reduce((sum, s) => sum + s.participationRate, 0) / studentStats.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">📊 퀴즈 시스템 통계</h1>
            <p className="text-indigo-100 text-sm mt-1">학급 전체 퀴즈 활동 현황</p>
          </div>
          <Link
            href="/admin"
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            관리자 홈
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 탭 */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📈 전체 현황
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'students'
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              👥 학생별 통계
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'topics'
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📚 주제별 통계
            </button>
          </div>

          <div className="p-6">
            {/* 전체 현황 탭 */}
            {activeTab === 'overview' && (
              <div>
                {/* 주요 지표 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
                    <div className="text-sm mb-1 opacity-90">총 도전 횟수</div>
                    <div className="text-3xl font-bold">{totalAttempts}회</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
                    <div className="text-sm mb-1 opacity-90">학급 평균 점수</div>
                    <div className="text-3xl font-bold">{averageClassScore}점</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
                    <div className="text-sm mb-1 opacity-90">총 퀴즈 수</div>
                    <div className="text-3xl font-bold">{totalQuizzes}개</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
                    <div className="text-sm mb-1 opacity-90">평균 참여율</div>
                    <div className="text-3xl font-bold">{avgParticipationRate}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 퀴즈 현황 */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📝 퀴즈 현황</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">총 퀴즈</span>
                        <span className="text-2xl font-bold text-gray-800">{totalQuizzes}개</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-700">학생 제작 퀴즈</span>
                        <span className="text-2xl font-bold text-blue-600">{studentQuizzes.length}개</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700">검증된 퀴즈</span>
                        <span className="text-2xl font-bold text-green-600">{verifiedQuizzes.length}개</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-gray-700">신고된 퀴즈</span>
                        <span className="text-2xl font-bold text-red-600">{reportedQuizzes.length}개</span>
                      </div>
                    </div>
                  </div>

                  {/* 주제 현황 */}
                  <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 주제 현황</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">총 주제</span>
                        <span className="text-2xl font-bold text-gray-800">{topics.length}개</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700">활성 주제</span>
                        <span className="text-2xl font-bold text-green-600">{activeTopics.length}개</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-gray-700">총 학생</span>
                        <span className="text-2xl font-bold text-purple-600">{students.length}명</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-gray-700">활동 학생</span>
                        <span className="text-2xl font-bold text-orange-600">
                          {studentStats.filter(s => s.totalAttempts > 0).length}명
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 난이도별 정답률 */}
                <div className="bg-white border rounded-xl p-6 mt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📊 난이도별 정답률</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['easy', 'medium', 'hard'].map(difficulty => {
                      const difficultyQuizzes = quizzes.filter(q => q.difficulty === difficulty);
                      const difficultyResults = results.filter(r => {
                        const quiz = quizzes.find(q => q.id === r.quizId);
                        return quiz?.difficulty === difficulty;
                      });
                      const correctRate = difficultyResults.length > 0
                        ? Math.round((difficultyResults.filter(r => r.isCorrect).length / difficultyResults.length) * 100)
                        : 0;

                      return (
                        <div key={difficulty} className="border rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-2">
                            {difficulty === 'easy' && '🟢 쉬움'}
                            {difficulty === 'medium' && '🟡 보통'}
                            {difficulty === 'hard' && '🔴 어려움'}
                          </div>
                          <div className="text-2xl font-bold text-gray-800 mb-1">{correctRate}%</div>
                          <div className="text-xs text-gray-600">
                            {difficultyQuizzes.length}개 문제 / {difficultyResults.length}번 풀이
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full ${
                                difficulty === 'easy' ? 'bg-green-500' :
                                difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${correctRate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 학생별 통계 탭 */}
            {activeTab === 'students' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">👥 학생별 활동 현황</h2>
                {studentStats.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    학생이 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">이름</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">도전 횟수</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">평균 점수</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">제작 퀴즈</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">검증 퀴즈</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">참여율</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {studentStats
                          .sort((a, b) => b.averageScore - a.averageScore)
                          .map(stat => (
                            <tr key={stat.studentId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                {stat.studentName}
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-700">
                                {stat.totalAttempts}회
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className={`font-bold ${
                                  stat.averageScore >= 90 ? 'text-green-600' :
                                  stat.averageScore >= 70 ? 'text-blue-600' :
                                  stat.averageScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {stat.averageScore}점
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-700">
                                {stat.totalQuizzesCreated}개
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">
                                {stat.verifiedQuizzes}개
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className={`font-bold ${
                                  stat.participationRate >= 80 ? 'text-green-600' :
                                  stat.participationRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {stat.participationRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 주제별 통계 탭 */}
            {activeTab === 'topics' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">📚 주제별 활동 현황</h2>
                {topicStats.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    주제가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topicStats.map(stat => (
                      <div key={stat.topicId} className="border rounded-lg p-6 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{stat.topicTitle}</h3>
                            <p className="text-sm text-gray-600">{stat.subject}</p>
                          </div>
                          <Link
                            href={`/admin/quiz-topics/${stat.topicId}`}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm transition"
                          >
                            관리하기
                          </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stat.totalStudentsParticipated}명</div>
                            <div className="text-xs text-gray-600">참여 학생</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{stat.participationRate}%</div>
                            <div className="text-xs text-gray-600">참여율</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{stat.totalAttempts}회</div>
                            <div className="text-xs text-gray-600">도전 횟수</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{stat.averageScore}점</div>
                            <div className="text-xs text-gray-600">평균 점수</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-pink-600">{stat.totalQuizzesCreated}개</div>
                            <div className="text-xs text-gray-600">제작 퀴즈</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
