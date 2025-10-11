'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import type { QuizTopic, Quiz, QuizType, QuizAttempt } from '@/lib/types';

export default function StudentQuizTopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;

  const [topic, setTopic] = useState<QuizTopic | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'solve'>('solve');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [myBestAttempt, setMyBestAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  const [quizForm, setQuizForm] = useState({
    type: 'multiple-choice' as QuizType,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    correctBoolean: true,
    explanation: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  // 학생 정보
  const studentData = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('studentData') || '{}')
    : {};

  useEffect(() => {
    if (!studentData.id) {
      alert('로그인이 필요합니다.');
      router.push('/student/login');
      return;
    }
    if (topicId) {
      fetchTopic();
      fetchQuizzes();
      fetchMyAttempts();
    }
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      const docRef = doc(db, 'quizTopics', topicId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTopic({
          id: docSnap.id,
          ...docSnap.data(),
          startDate: docSnap.data().startDate?.toDate(),
          dueDate: docSnap.data().dueDate?.toDate(),
          createdAt: docSnap.data().createdAt?.toDate(),
        } as QuizTopic);
      }
      setLoading(false);
    } catch (err) {
      console.error('주제 불러오기 실패:', err);
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const q = query(collection(db, 'quizzes'), where('topicId', '==', topicId));
      const querySnapshot = await getDocs(q);
      const quizzesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Quiz[];

      setQuizzes(quizzesData);
      setMyQuizzes(quizzesData.filter(q => q.createdBy === studentData.id));
    } catch (err) {
      console.error('퀴즈 목록 불러오기 실패:', err);
    }
  };

  const fetchMyAttempts = async () => {
    try {
      const q = query(
        collection(db, 'quizAttempts'),
        where('topicId', '==', topicId),
        where('studentId', '==', studentData.id)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const attempts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          completedAt: doc.data().completedAt?.toDate(),
        })) as QuizAttempt[];

        const best = attempts.reduce((best, current) =>
          current.score > best.score ? current : best
        );
        setMyBestAttempt(best);
      }
    } catch (err) {
      console.error('도전 기록 불러오기 실패:', err);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    // 최대 출제 개수 체크
    if (myQuizzes.length >= topic.maxQuizzesPerStudent) {
      alert(`최대 ${topic.maxQuizzesPerStudent}개까지만 출제할 수 있습니다.`);
      return;
    }

    try {
      const quizData: any = {
        topicId,
        type: quizForm.type,
        question: quizForm.question,
        explanation: quizForm.explanation,
        subject: topic.subject,
        difficulty: quizForm.difficulty,
        createdAt: new Date(),
        createdBy: studentData.id,
        createdByName: studentData.name,
        isVerified: false,
        reportCount: 0,
      };

      if (quizForm.type === 'multiple-choice') {
        quizData.options = quizForm.options;
        quizData.correctAnswer = quizForm.correctAnswer;
      } else {
        quizData.correctBoolean = quizForm.correctBoolean;
      }

      await addDoc(collection(db, 'quizzes'), quizData);
      alert('퀴즈가 생성되었습니다! 🎉');
      setShowQuizModal(false);
      resetQuizForm();
      fetchQuizzes();
    } catch (err) {
      console.error('퀴즈 생성 실패:', err);
      alert('퀴즈 생성에 실패했습니다.');
    }
  };

  const handleDeleteMyQuiz = async (quizId: string) => {
    if (confirm('정말 이 퀴즈를 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'quizzes', quizId));
        alert('퀴즈가 삭제되었습니다.');
        fetchQuizzes();
      } catch (err) {
        console.error('퀴즈 삭제 실패:', err);
        alert('퀴즈 삭제에 실패했습니다.');
      }
    }
  };

  const resetQuizForm = () => {
    setQuizForm({
      type: topic?.allowedQuizTypes[0] || 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      correctBoolean: true,
      explanation: '',
      difficulty: 'medium',
    });
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">🟢 쉬움</span>;
      case 'medium':
        return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">🟡 보통</span>;
      case 'hard':
        return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">🔴 어려움</span>;
    }
  };

  const startFullChallenge = () => {
    if (quizzes.length === 0) {
      alert('아직 풀 수 있는 퀴즈가 없습니다.');
      return;
    }
    router.push(`/student/quiz-topics/${topicId}/solve?mode=full`);
  };

  const startRandomChallenge = () => {
    if (quizzes.length === 0) {
      alert('아직 풀 수 있는 퀴즈가 없습니다.');
      return;
    }
    router.push(`/student/quiz-topics/${topicId}/solve?mode=random`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">주제를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const othersQuizzes = quizzes.filter(q => q.createdBy !== studentData.id);
  const isExpired = new Date() > topic.dueDate;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-purple-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{topic.title}</h1>
            <p className="text-purple-100 text-sm mt-1">
              {topic.subject} | 마감: {topic.dueDate.toLocaleDateString('ko-KR')}
              {isExpired && <span className="ml-2 bg-red-500 px-2 py-1 rounded text-xs">마감됨</span>}
            </p>
          </div>
          <Link
            href="/student/quiz-topics"
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            목록으로
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">전체 퀴즈</div>
            <div className="text-2xl font-bold text-purple-600">{quizzes.length}개</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">내가 만든 퀴즈</div>
            <div className="text-2xl font-bold text-blue-600">
              {myQuizzes.length}/{topic.maxQuizzesPerStudent}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">다른 학생 퀴즈</div>
            <div className="text-2xl font-bold text-green-600">{othersQuizzes.length}개</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">내 최고 점수</div>
            <div className="text-2xl font-bold text-orange-600">
              {myBestAttempt ? `${myBestAttempt.score}%` : '-'}
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('solve')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'solve'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🎯 퀴즈 풀기
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'create'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              ✏️ 퀴즈 만들기
            </button>
          </div>

          <div className="p-6">
            {/* 퀴즈 풀기 탭 */}
            {activeTab === 'solve' && (
              <div>
                {/* 도전 모드 선택 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* 전체 도전 */}
                  <div className="border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition">
                    <div className="text-3xl mb-3">🎯</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">전체 도전</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      모든 문제를 한번에 풀어보세요. 점수가 기록됩니다.
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">총 문제 수</span>
                      <span className="font-bold text-purple-600">{quizzes.length}개</span>
                    </div>
                    {myBestAttempt && (
                      <div className="bg-green-50 rounded-lg p-3 mb-4">
                        <div className="text-sm text-gray-600">내 최고 점수</div>
                        <div className="text-2xl font-bold text-green-600">
                          {myBestAttempt.correctAnswers}/{myBestAttempt.totalQuestions} ({myBestAttempt.score}%)
                        </div>
                      </div>
                    )}
                    <button
                      onClick={startFullChallenge}
                      disabled={quizzes.length === 0}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {myBestAttempt ? '다시 도전하기' : '도전하기'}
                    </button>
                  </div>

                  {/* 랜덤 도전 */}
                  <div className="border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition">
                    <div className="text-3xl mb-3">🎲</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">랜덤 도전</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      무작위로 10문제를 풀어보세요. 연습용입니다.
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">문제 수</span>
                      <span className="font-bold text-blue-600">10개 (무작위)</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <div className="text-sm text-gray-600">매번 다른 문제가 나와요!</div>
                      <div className="text-xs text-gray-500 mt-1">점수는 기록되지 않습니다</div>
                    </div>
                    <button
                      onClick={startRandomChallenge}
                      disabled={quizzes.length < 10}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      랜덤 도전하기
                    </button>
                  </div>
                </div>

                {/* 개별 문제 목록 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    📝 개별 문제 목록 ({quizzes.length}개)
                  </h3>
                  {quizzes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      아직 출제된 퀴즈가 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizzes.map((quiz, index) => (
                        <div
                          key={quiz.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-700">{index + 1}.</span>
                                <span className="font-semibold text-gray-800">{quiz.question}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getDifficultyBadge(quiz.difficulty)}
                                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                  {quiz.type === 'multiple-choice' ? '4지선다' : 'OX'}
                                </span>
                                <span className="text-xs text-gray-600">
                                  출제: {quiz.createdByName}
                                </span>
                                {quiz.createdBy === 'teacher' && (
                                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                    ⭐ 선생님
                                  </span>
                                )}
                                {quiz.isVerified && quiz.createdBy !== 'teacher' && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                    ✓ 검증됨
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => router.push(`/student/quiz-topics/${topicId}/solve?mode=single&quizId=${quiz.id}`)}
                              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition"
                            >
                              풀기
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 퀴즈 만들기 탭 */}
            {activeTab === 'create' && (
              <div>
                {/* 안내 & 버튼 */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-blue-700 font-semibold mb-1">
                        💡 좋은 퀴즈 만들기 팁
                      </p>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>✓ 명확한 질문을 만들어요</li>
                        <li>✓ 헷갈리지 않는 선택지를 작성해요</li>
                        <li>✓ 자세한 해설을 작성해요</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => {
                        if (myQuizzes.length >= topic.maxQuizzesPerStudent) {
                          alert(`최대 ${topic.maxQuizzesPerStudent}개까지만 출제할 수 있습니다.`);
                          return;
                        }
                        if (isExpired) {
                          alert('마감된 주제에는 퀴즈를 만들 수 없습니다.');
                          return;
                        }
                        resetQuizForm();
                        setShowQuizModal(true);
                      }}
                      disabled={myQuizzes.length >= topic.maxQuizzesPerStudent || isExpired}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      + 새 퀴즈 만들기
                    </button>
                  </div>
                  {myQuizzes.length >= topic.maxQuizzesPerStudent && (
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ 최대 출제 개수에 도달했습니다.
                    </p>
                  )}
                </div>

                {/* 내가 만든 퀴즈 목록 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    내가 만든 퀴즈 ({myQuizzes.length}/{topic.maxQuizzesPerStudent})
                  </h3>
                  {myQuizzes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      아직 만든 퀴즈가 없습니다. 첫 퀴즈를 만들어보세요!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myQuizzes.map((quiz, index) => (
                        <div
                          key={quiz.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-700">{index + 1}.</span>
                                <span className="font-semibold text-gray-800">{quiz.question}</span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                {getDifficultyBadge(quiz.difficulty)}
                                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                  {quiz.type === 'multiple-choice' ? '4지선다' : 'OX'}
                                </span>
                                {quiz.isVerified && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                    ✓ 선생님 검증
                                  </span>
                                )}
                                {quiz.reportCount > 0 && (
                                  <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                                    🚨 신고 {quiz.reportCount}건
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                정답: {quiz.type === 'multiple-choice'
                                  ? String.fromCharCode(65 + (quiz.correctAnswer || 0))
                                  : quiz.correctBoolean ? 'O' : 'X'
                                } | {quiz.explanation}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteMyQuiz(quiz.id)}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 퀴즈 생성 모달 */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">새 퀴즈 만들기</h3>
            <form onSubmit={handleCreateQuiz}>
              <div className="space-y-4">
                {/* 퀴즈 유형 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    퀴즈 유형 *
                  </label>
                  <div className="flex gap-4">
                    {topic.allowedQuizTypes.includes('multiple-choice') && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="quizType"
                          checked={quizForm.type === 'multiple-choice'}
                          onChange={() => setQuizForm({ ...quizForm, type: 'multiple-choice' })}
                          className="mr-2"
                        />
                        <span className="text-gray-700">4지선다</span>
                      </label>
                    )}
                    {topic.allowedQuizTypes.includes('true-false') && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="quizType"
                          checked={quizForm.type === 'true-false'}
                          onChange={() => setQuizForm({ ...quizForm, type: 'true-false' })}
                          className="mr-2"
                        />
                        <span className="text-gray-700">OX 퀴즈</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* 문제 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    문제 *
                  </label>
                  <textarea
                    required
                    value={quizForm.question}
                    onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 h-24"
                    placeholder="문제를 입력하세요"
                  />
                </div>

                {/* 4지선다 선택지 */}
                {quizForm.type === 'multiple-choice' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        선택지 *
                      </label>
                      {quizForm.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-700 w-8">
                            {String.fromCharCode(65 + idx)})
                          </span>
                          <input
                            type="text"
                            required
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...quizForm.options];
                              newOptions[idx] = e.target.value;
                              setQuizForm({ ...quizForm, options: newOptions });
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                            placeholder={`선택지 ${String.fromCharCode(65 + idx)}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        정답 *
                      </label>
                      <div className="flex gap-4">
                        {quizForm.options.map((_, idx) => (
                          <label key={idx} className="flex items-center">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={quizForm.correctAnswer === idx}
                              onChange={() => setQuizForm({ ...quizForm, correctAnswer: idx })}
                              className="mr-2"
                            />
                            <span className="text-gray-700">{String.fromCharCode(65 + idx)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* OX 정답 */}
                {quizForm.type === 'true-false' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      정답 *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="correctBoolean"
                          checked={quizForm.correctBoolean === true}
                          onChange={() => setQuizForm({ ...quizForm, correctBoolean: true })}
                          className="mr-2"
                        />
                        <span className="text-gray-700">O (맞다)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="correctBoolean"
                          checked={quizForm.correctBoolean === false}
                          onChange={() => setQuizForm({ ...quizForm, correctBoolean: false })}
                          className="mr-2"
                        />
                        <span className="text-gray-700">X (틀리다)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 해설 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    해설 *
                  </label>
                  <textarea
                    required
                    value={quizForm.explanation}
                    onChange={(e) => setQuizForm({ ...quizForm, explanation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 h-20"
                    placeholder="정답에 대한 해설을 입력하세요"
                  />
                </div>

                {/* 난이도 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    난이도 *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        checked={quizForm.difficulty === 'easy'}
                        onChange={() => setQuizForm({ ...quizForm, difficulty: 'easy' })}
                        className="mr-2"
                      />
                      <span className="text-gray-700">🟢 쉬움</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        checked={quizForm.difficulty === 'medium'}
                        onChange={() => setQuizForm({ ...quizForm, difficulty: 'medium' })}
                        className="mr-2"
                      />
                      <span className="text-gray-700">🟡 보통</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        checked={quizForm.difficulty === 'hard'}
                        onChange={() => setQuizForm({ ...quizForm, difficulty: 'hard' })}
                        className="mr-2"
                      />
                      <span className="text-gray-700">🔴 어려움</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuizModal(false);
                    resetQuizForm();
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
