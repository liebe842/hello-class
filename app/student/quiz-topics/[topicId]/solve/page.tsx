'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  query,
  where
} from 'firebase/firestore';
import type { QuizTopic, Quiz, QuizResult } from '@/lib/types';

export default function QuizSolvePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const topicId = params.topicId as string;
  const mode = searchParams.get('mode') as 'full' | 'random' | 'single';
  const quizId = searchParams.get('quizId');

  const [topic, setTopic] = useState<QuizTopic | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(number | boolean | null)[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [loading, setLoading] = useState(true);

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
      fetchTopicAndQuizzes();
    }
  }, [topicId]);

  const fetchTopicAndQuizzes = async () => {
    try {
      // 주제 가져오기
      const topicDoc = await getDoc(doc(db, 'quizTopics', topicId));
      if (topicDoc.exists()) {
        setTopic({
          id: topicDoc.id,
          ...topicDoc.data(),
          startDate: topicDoc.data().startDate?.toDate(),
          dueDate: topicDoc.data().dueDate?.toDate(),
          createdAt: topicDoc.data().createdAt?.toDate(),
        } as QuizTopic);
      }

      // 퀴즈 가져오기
      let quizzesToSolve: Quiz[] = [];

      if (mode === 'single' && quizId) {
        // 개별 문제
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
        if (quizDoc.exists()) {
          quizzesToSolve = [{
            id: quizDoc.id,
            ...quizDoc.data(),
            createdAt: quizDoc.data().createdAt?.toDate(),
          } as Quiz];
        }
      } else {
        // 전체 또는 랜덤
        const q = query(collection(db, 'quizzes'), where('topicId', '==', topicId));
        const querySnapshot = await getDocs(q);
        const allQuizzes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Quiz[];

        if (mode === 'random') {
          // 랜덤으로 10개 선택
          const shuffled = [...allQuizzes].sort(() => Math.random() - 0.5);
          quizzesToSolve = shuffled.slice(0, Math.min(10, allQuizzes.length));
        } else {
          // 전체
          quizzesToSolve = allQuizzes;
        }
      }

      setQuizzes(quizzesToSolve);
      setAnswers(new Array(quizzesToSolve.length).fill(null));
      setLoading(false);
    } catch (err) {
      console.error('퀴즈 불러오기 실패:', err);
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) {
      alert('답을 선택해주세요!');
      return;
    }

    const currentQuiz = quizzes[currentQuizIndex];
    const isCorrect =
      currentQuiz.type === 'multiple-choice'
        ? selectedAnswer === currentQuiz.correctAnswer
        : selectedAnswer === currentQuiz.correctBoolean;

    // 답안 저장
    const newAnswers = [...answers];
    newAnswers[currentQuizIndex] = selectedAnswer;
    setAnswers(newAnswers);

    // 결과 저장 (개별 문제 결과)
    try {
      const responseTime = Math.floor((Date.now() - startTime) / 1000);
      await addDoc(collection(db, 'quizResults'), {
        quizId: currentQuiz.id,
        topicId,
        studentId: studentData.id,
        studentName: studentData.name,
        selectedAnswer,
        isCorrect,
        answeredAt: new Date(),
        responseTime,
      });
    } catch (err) {
      console.error('결과 저장 실패:', err);
    }

    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setStartTime(Date.now());
    } else {
      // 마지막 문제 - 최종 결과 표시
      handleFinish();
    }
  };

  const handleFinish = async () => {
    const correctCount = answers.filter((answer, idx) => {
      const quiz = quizzes[idx];
      if (quiz.type === 'multiple-choice') {
        return answer === quiz.correctAnswer;
      } else {
        return answer === quiz.correctBoolean;
      }
    }).length;

    const score = Math.round((correctCount / quizzes.length) * 100);

    // 전체 도전인 경우에만 QuizAttempt 저장
    if (mode === 'full') {
      try {
        await addDoc(collection(db, 'quizAttempts'), {
          topicId,
          studentId: studentData.id,
          studentName: studentData.name,
          mode: 'full',
          totalQuestions: quizzes.length,
          correctAnswers: correctCount,
          score,
          completedAt: new Date(),
          timeSpent: Math.floor((Date.now() - startTime) / 1000),
        });
      } catch (err) {
        console.error('도전 기록 저장 실패:', err);
      }
    }

    setShowFinalResult(true);
  };

  const currentQuiz = quizzes[currentQuizIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">풀 수 있는 퀴즈가 없습니다.</p>
          <Link
            href={`/student/quiz-topics/${topicId}`}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition"
          >
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 최종 결과 화면
  if (showFinalResult) {
    const correctCount = answers.filter((answer, idx) => {
      const quiz = quizzes[idx];
      if (quiz.type === 'multiple-choice') {
        return answer === quiz.correctAnswer;
      } else {
        return answer === quiz.correctBoolean;
      }
    }).length;
    const score = Math.round((correctCount / quizzes.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">
              {score >= 90 ? '🏆' : score >= 70 ? '🎉' : score >= 50 ? '👍' : '💪'}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {mode === 'full' ? '전체 도전' : mode === 'random' ? '랜덤 도전' : '문제 풀이'} 완료!
            </h2>
            <p className="text-gray-600">
              {mode === 'full'
                ? '모든 문제를 풀었어요! 점수가 기록되었습니다.'
                : mode === 'random'
                ? '랜덤 도전을 완료했어요!'
                : '문제를 풀었어요!'}
            </p>
          </div>

          {/* 점수 */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-8 mb-6">
            <div className="text-center text-white">
              <div className="text-lg mb-2">점수</div>
              <div className="text-6xl font-bold mb-2">{score}%</div>
              <div className="text-xl">
                {correctCount} / {quizzes.length} 정답
              </div>
            </div>
          </div>

          {/* 틀린 문제 복습 */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3">문제 복습</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {quizzes.map((quiz, idx) => {
                const myAnswer = answers[idx];
                const isCorrect =
                  quiz.type === 'multiple-choice'
                    ? myAnswer === quiz.correctAnswer
                    : myAnswer === quiz.correctBoolean;

                return (
                  <div
                    key={quiz.id}
                    className={`p-3 rounded-lg border-2 ${
                      isCorrect
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 mb-1">
                          {idx + 1}. {quiz.question}
                        </div>
                        <div className="text-sm text-gray-600">
                          {isCorrect ? (
                            <span className="text-green-600">✅ 정답!</span>
                          ) : (
                            <>
                              <span className="text-red-600">❌ 오답</span>
                              <br />
                              정답: {quiz.type === 'multiple-choice'
                                ? String.fromCharCode(65 + (quiz.correctAnswer || 0))
                                : quiz.correctBoolean ? 'O' : 'X'
                              }
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-2xl">
                        {isCorrect ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <Link
              href={`/student/quiz-topics/${topicId}`}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition text-center"
            >
              주제로 돌아가기
            </Link>
            {mode !== 'single' && (
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition"
              >
                다시 도전하기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 문제 풀이 화면
  const isMultipleChoice = currentQuiz.type === 'multiple-choice';
  const currentAnswer = answers[currentQuizIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-t-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{topic?.title}</h1>
              <p className="text-sm text-gray-600">
                {mode === 'full' ? '전체 도전' : mode === 'random' ? '랜덤 도전' : '개별 문제'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">진행률</div>
              <div className="text-2xl font-bold text-purple-600">
                {currentQuizIndex + 1} / {quizzes.length}
              </div>
            </div>
          </div>

          {/* 진행 바 */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
              style={{ width: `${((currentQuizIndex + 1) / quizzes.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 문제 */}
        <div className="bg-white p-8 shadow-lg">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
                {currentQuiz.difficulty === 'easy' ? '🟢 쉬움' :
                 currentQuiz.difficulty === 'medium' ? '🟡 보통' : '🔴 어려움'}
              </span>
              <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                {isMultipleChoice ? '4지선다' : 'OX'}
              </span>
              <span className="text-xs text-gray-600">
                출제: {currentQuiz.createdByName}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              문제 {currentQuizIndex + 1}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              {currentQuiz.question}
            </p>
          </div>

          {/* 선택지 */}
          <div className="space-y-3">
            {isMultipleChoice ? (
              // 4지선다
              currentQuiz.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => !showResult && setSelectedAnswer(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${
                    showResult
                      ? idx === currentQuiz.correctAnswer
                        ? 'bg-green-100 border-green-500'
                        : selectedAnswer === idx
                        ? 'bg-red-100 border-red-500'
                        : 'bg-gray-50 border-gray-200'
                      : selectedAnswer === idx
                      ? 'bg-purple-100 border-purple-500'
                      : 'bg-white border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                  } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-gray-700">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="text-gray-800">{option}</span>
                    </div>
                    {showResult && idx === currentQuiz.correctAnswer && (
                      <span className="text-2xl">✅</span>
                    )}
                    {showResult && selectedAnswer === idx && idx !== currentQuiz.correctAnswer && (
                      <span className="text-2xl">❌</span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              // OX
              <>
                <button
                  onClick={() => !showResult && setSelectedAnswer(true)}
                  disabled={showResult}
                  className={`w-full text-left p-6 rounded-xl border-2 transition ${
                    showResult
                      ? currentQuiz.correctBoolean === true
                        ? 'bg-green-100 border-green-500'
                        : selectedAnswer === true
                        ? 'bg-red-100 border-red-500'
                        : 'bg-gray-50 border-gray-200'
                      : selectedAnswer === true
                      ? 'bg-purple-100 border-purple-500'
                      : 'bg-white border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                  } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">⭕</span>
                      <span className="text-xl font-bold text-gray-800">O (맞다)</span>
                    </div>
                    {showResult && currentQuiz.correctBoolean === true && (
                      <span className="text-2xl">✅</span>
                    )}
                    {showResult && selectedAnswer === true && currentQuiz.correctBoolean !== true && (
                      <span className="text-2xl">❌</span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => !showResult && setSelectedAnswer(false)}
                  disabled={showResult}
                  className={`w-full text-left p-6 rounded-xl border-2 transition ${
                    showResult
                      ? currentQuiz.correctBoolean === false
                        ? 'bg-green-100 border-green-500'
                        : selectedAnswer === false
                        ? 'bg-red-100 border-red-500'
                        : 'bg-gray-50 border-gray-200'
                      : selectedAnswer === false
                      ? 'bg-purple-100 border-purple-500'
                      : 'bg-white border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                  } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">❌</span>
                      <span className="text-xl font-bold text-gray-800">X (틀리다)</span>
                    </div>
                    {showResult && currentQuiz.correctBoolean === false && (
                      <span className="text-2xl">✅</span>
                    )}
                    {showResult && selectedAnswer === false && currentQuiz.correctBoolean !== false && (
                      <span className="text-2xl">❌</span>
                    )}
                  </div>
                </button>
              </>
            )}
          </div>

          {/* 해설 */}
          {showResult && (
            <div className="mt-6 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">💡 해설</h3>
              <p className="text-gray-700">{currentQuiz.explanation}</p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="bg-white rounded-b-2xl p-6 shadow-lg">
          <div className="flex gap-3">
            {!showResult ? (
              <>
                <Link
                  href={`/student/quiz-topics/${topicId}`}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                >
                  나가기
                </Link>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  제출하기
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition"
              >
                {currentQuizIndex < quizzes.length - 1 ? '다음 문제 →' : '결과 보기'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
