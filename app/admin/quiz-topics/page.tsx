'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { QuizTopic, QuizType } from '@/lib/types';

export default function AdminQuizTopicsPage() {
  const [topics, setTopics] = useState<QuizTopic[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<QuizTopic | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '수학',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxQuizzesPerStudent: 3,
    allowedQuizTypes: ['multiple-choice', 'true-false'] as QuizType[],
  });

  const subjects = ['수학', '국어', '영어', '과학', '사회', '기타'];

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'quizTopics'));
      const topicsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as QuizTopic[];

      topicsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTopics(topicsData);
    } catch (err) {
      console.error('주제 목록 불러오기 실패:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTopic) {
        // 수정
        await updateDoc(doc(db, 'quizTopics', editingTopic.id), {
          ...formData,
          startDate: new Date(formData.startDate),
          dueDate: new Date(formData.dueDate),
        });
        alert('주제가 수정되었습니다!');
      } else {
        // 새로 생성
        await addDoc(collection(db, 'quizTopics'), {
          ...formData,
          startDate: new Date(formData.startDate),
          dueDate: new Date(formData.dueDate),
          createdAt: new Date(),
          createdBy: 'teacher',
          isActive: true,
        });
        alert('주제가 생성되었습니다!');
      }
      setShowModal(false);
      setEditingTopic(null);
      resetForm();
      fetchTopics();
    } catch (err) {
      console.error('주제 저장 실패:', err);
      alert('주제 저장에 실패했습니다.');
    }
  };

  const handleEdit = (topic: QuizTopic) => {
    setEditingTopic(topic);
    setFormData({
      title: topic.title,
      description: topic.description,
      subject: topic.subject,
      startDate: topic.startDate.toISOString().split('T')[0],
      dueDate: topic.dueDate.toISOString().split('T')[0],
      maxQuizzesPerStudent: topic.maxQuizzesPerStudent,
      allowedQuizTypes: topic.allowedQuizTypes,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까? 이 주제의 모든 퀴즈도 삭제됩니다.')) {
      try {
        await deleteDoc(doc(db, 'quizTopics', id));
        alert('주제가 삭제되었습니다.');
        fetchTopics();
      } catch (err) {
        console.error('주제 삭제 실패:', err);
        alert('주제 삭제에 실패했습니다.');
      }
    }
  };

  const toggleActive = async (topic: QuizTopic) => {
    try {
      await updateDoc(doc(db, 'quizTopics', topic.id), {
        isActive: !topic.isActive,
      });
      fetchTopics();
    } catch (err) {
      console.error('상태 변경 실패:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '수학',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxQuizzesPerStudent: 3,
      allowedQuizTypes: ['multiple-choice', 'true-false'],
    });
  };

  const handleQuizTypeToggle = (type: QuizType) => {
    setFormData(prev => ({
      ...prev,
      allowedQuizTypes: prev.allowedQuizTypes.includes(type)
        ? prev.allowedQuizTypes.filter(t => t !== type)
        : [...prev.allowedQuizTypes, type],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-purple-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">퀴즈 주제 관리</h1>
          <Link
            href="/admin"
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            관리자 홈
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 상단 액션 바 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            전체 주제 ({topics.length}개)
          </h2>
          <button
            onClick={() => {
              setEditingTopic(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            + 새 주제 만들기
          </button>
        </div>

        {/* 주제 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              생성된 퀴즈 주제가 없습니다. 새 주제를 만들어보세요.
            </div>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition ${
                  !topic.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* 상단 배지 */}
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
                    {topic.subject}
                  </span>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      topic.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {topic.isActive ? '활성' : '비활성'}
                  </span>
                </div>

                {/* 제목 & 설명 */}
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {topic.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {topic.description}
                </p>

                {/* 기간 */}
                <div className="text-xs text-gray-500 mb-4">
                  <div>시작: {topic.startDate.toLocaleDateString('ko-KR')}</div>
                  <div>마감: {topic.dueDate.toLocaleDateString('ko-KR')}</div>
                </div>

                {/* 설정 정보 */}
                <div className="border-t pt-4 mb-4">
                  <div className="text-sm text-gray-700 mb-1">
                    1인당 최대: <span className="font-semibold">{topic.maxQuizzesPerStudent}개</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    유형: <span className="font-semibold">
                      {topic.allowedQuizTypes.includes('multiple-choice') && '4지선다'}
                      {topic.allowedQuizTypes.includes('multiple-choice') &&
                       topic.allowedQuizTypes.includes('true-false') && ', '}
                      {topic.allowedQuizTypes.includes('true-false') && 'OX'}
                    </span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <Link
                    href={`/admin/quiz-topics/${topic.id}`}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-center py-2 rounded-lg transition text-sm font-medium"
                  >
                    상세보기
                  </Link>
                  <button
                    onClick={() => handleEdit(topic)}
                    className="px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => toggleActive(topic)}
                    className="px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition text-sm"
                  >
                    {topic.isActive ? '비활성' : '활성'}
                  </button>
                  <button
                    onClick={() => handleDelete(topic.id)}
                    className="px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 주제 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {editingTopic ? '주제 수정' : '새 퀴즈 주제 만들기'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    주제 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="예: 3단원 식물의 구조"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 h-24"
                    placeholder="학생들에게 보여줄 설명을 입력하세요"
                  />
                </div>

                {/* 과목 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    과목 *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                {/* 기간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      시작일 *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      마감일 *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    />
                  </div>
                </div>

                {/* 1인당 최대 출제 개수 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    학생 1인당 최대 출제 개수 *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={formData.maxQuizzesPerStudent}
                    onChange={(e) => setFormData({ ...formData, maxQuizzesPerStudent: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">학생 한 명이 출제할 수 있는 최대 퀴즈 개수</p>
                </div>

                {/* 허용할 퀴즈 유형 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    허용할 퀴즈 유형 *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.allowedQuizTypes.includes('multiple-choice')}
                        onChange={() => handleQuizTypeToggle('multiple-choice')}
                        className="w-5 h-5 text-purple-600 rounded mr-2"
                      />
                      <span className="text-gray-700">4지선다</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.allowedQuizTypes.includes('true-false')}
                        onChange={() => handleQuizTypeToggle('true-false')}
                        className="w-5 h-5 text-purple-600 rounded mr-2"
                      />
                      <span className="text-gray-700">OX 퀴즈</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">최소 1개 이상 선택해야 합니다</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTopic(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={formData.allowedQuizTypes.length === 0}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTopic ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
