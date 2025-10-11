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
import type { QuizTopic, Quiz, Student, QuizType } from '@/lib/types';

export default function AdminQuizTopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;

  const [topic, setTopic] = useState<QuizTopic | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState({
    type: 'multiple-choice' as QuizType,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    correctBoolean: true,
    explanation: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  useEffect(() => {
    if (topicId) {
      fetchTopic();
      fetchQuizzes();
      fetchStudents();
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
    } catch (err) {
      console.error('주제 불러오기 실패:', err);
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

      quizzesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setQuizzes(quizzesData);
    } catch (err) {
      console.error('퀴즈 목록 불러오기 실패:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Student[];
      setStudents(studentsData);
    } catch (err) {
      console.error('학생 목록 불러오기 실패:', err);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    try {
      const quizData: any = {
        topicId,
        type: quizForm.type,
        question: quizForm.question,
        explanation: quizForm.explanation,
        subject: topic.subject,
        difficulty: quizForm.difficulty,
        createdAt: new Date(),
        createdBy: 'teacher',
        createdByName: '선생님',
        isVerified: true,
        reportCount: 0,
      };

      if (quizForm.type === 'multiple-choice') {
        quizData.options = quizForm.options;
        quizData.correctAnswer = quizForm.correctAnswer;
      } else {
        quizData.correctBoolean = quizForm.correctBoolean;
      }

      await addDoc(collection(db, 'quizzes'), quizData);
      alert('퀴즈가 생성되었습니다!');
      setShowQuizModal(false);
      resetQuizForm();
      fetchQuizzes();
    } catch (err) {
      console.error('퀴즈 생성 실패:', err);
      alert('퀴즈 생성에 실패했습니다.');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
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

  const handleVerifyQuiz = async (quizId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        isVerified: !currentStatus,
      });
      fetchQuizzes();
    } catch (err) {
      console.error('검증 상태 변경 실패:', err);
    }
  };

  const resetQuizForm = () => {
    setQuizForm({
      type: 'multiple-choice',
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

  // 학생별 출제 현황 계산
  const getStudentQuizCounts = () => {
    const counts: { [key: string]: { name: string; count: number } } = {};

    students.forEach(student => {
      counts[student.id] = {
        name: student.name,
        count: quizzes.filter(q => q.createdBy === student.id).length,
      };
    });

    return Object.entries(counts);
  };

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  const teacherQuizzes = quizzes.filter(q => q.createdBy === 'teacher');
  const studentQuizzes = quizzes.filter(q => q.createdBy !== 'teacher');
  const reportedQuizzes = quizzes.filter(q => q.reportCount > 0);
  const unverifiedQuizzes = studentQuizzes.filter(q => !q.isVerified);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-purple-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{topic.title}</h1>
            <p className="text-purple-100 text-sm mt-1">{topic.subject} | 마감: {topic.dueDate.toLocaleDateString('ko-KR')}</p>
          </div>
          <Link
            href="/admin/quiz-topics"
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            목록으로
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">전체 퀴즈</div>
            <div className="text-2xl font-bold text-purple-600">{quizzes.length}개</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">교사 출제</div>
            <div className="text-2xl font-bold text-blue-600">{teacherQuizzes.length}개</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">학생 출제</div>
            <div className="text-2xl font-bold text-green-600">{studentQuizzes.length}개</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">신고된 퀴즈</div>
            <div className="text-2xl font-bold text-red-600">{reportedQuizzes.length}개</div>
          </div>
        </div>

        {/* 주요 액션 */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowQuizModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            + 교사 퀴즈 출제
          </button>
        </div>

        {/* 신고된 퀴즈 섹션 */}
        {reportedQuizzes.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ 신고된 퀴즈 ({reportedQuizzes.length}개)</h3>
            <div className="space-y-3">
              {reportedQuizzes.map(quiz => (
                <div key={quiz.id} className="bg-white rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{quiz.question}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      출제: {quiz.createdByName} | 신고 {quiz.reportCount}건
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyQuiz(quiz.id, quiz.isVerified)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                    >
                      확인완료
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 미검증 퀴즈 섹션 */}
        {unverifiedQuizzes.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-yellow-800 mb-4">✅ 검증 필요 ({unverifiedQuizzes.length}개)</h3>
            <div className="space-y-3">
              {unverifiedQuizzes.slice(0, 5).map(quiz => (
                <div key={quiz.id} className="bg-white rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{quiz.question}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      출제: {quiz.createdByName}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyQuiz(quiz.id, quiz.isVerified)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                    >
                      검증 ✓
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {unverifiedQuizzes.length > 5 && (
                <div className="text-center text-sm text-gray-600">
                  외 {unverifiedQuizzes.length - 5}개 더...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 학생별 출제 현황 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            학생별 출제 현황 (최대 {topic.maxQuizzesPerStudent}개)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {getStudentQuizCounts().map(([studentId, data]) => (
              <div
                key={studentId}
                className={`p-3 rounded-lg border-2 ${
                  data.count >= topic.maxQuizzesPerStudent
                    ? 'bg-green-50 border-green-300'
                    : data.count > 0
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="text-sm font-semibold text-gray-800">{data.name}</div>
                <div className="text-lg font-bold text-purple-600">
                  {data.count}/{topic.maxQuizzesPerStudent}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 전체 퀴즈 목록 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            전체 퀴즈 목록 ({quizzes.length}개)
          </h3>
          <div className="space-y-3">
            {quizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 출제된 퀴즈가 없습니다.
              </div>
            ) : (
              quizzes.map((quiz, index) => (
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
                        {quiz.reportCount > 0 && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                            🚨 신고 {quiz.reportCount}건
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        출제: {quiz.createdByName} |
                        {quiz.type === 'multiple-choice'
                          ? ` 정답: ${String.fromCharCode(65 + (quiz.correctAnswer || 0))}`
                          : ` 정답: ${quiz.correctBoolean ? 'O' : 'X'}`
                        }
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!quiz.isVerified && quiz.createdBy !== 'teacher' && (
                        <button
                          onClick={() => handleVerifyQuiz(quiz.id, quiz.isVerified)}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                        >
                          검증
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 퀴즈 출제 모달 */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">교사 퀴즈 출제</h3>
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
                  출제하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
