'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import type { Assignment, SubmissionType } from '@/lib/types';

export default function AssignmentsManagePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    submissionType: 'all' as SubmissionType,
  });

  // 과제 목록 불러오기
  const fetchAssignments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'assignments'));
      const assignmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Assignment[];
      setAssignments(assignmentsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('과제 목록 불러오기 실패:', error);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // 과제 추가 또는 수정
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAssignment) {
      // 수정 모드
      try {
        await updateDoc(doc(db, 'assignments', editingAssignment.id), {
          title: formData.title,
          description: formData.description,
          dueDate: Timestamp.fromDate(new Date(formData.dueDate)),
          submissionType: formData.submissionType,
        });
        alert('과제가 수정되었습니다!');
        setShowAddModal(false);
        setEditingAssignment(null);
        setFormData({ title: '', description: '', dueDate: '', submissionType: 'all' });
        fetchAssignments();
      } catch (error) {
        console.error('과제 수정 실패:', error);
        alert('과제 수정에 실패했습니다.');
      }
    } else {
      // 등록 모드
      try {
        await addDoc(collection(db, 'assignments'), {
          title: formData.title,
          description: formData.description,
          dueDate: Timestamp.fromDate(new Date(formData.dueDate)),
          submissionType: formData.submissionType,
          createdAt: Timestamp.fromDate(new Date()),
          createdBy: '관리자',
        });
        alert('과제가 등록되었습니다!');
        setShowAddModal(false);
        setFormData({ title: '', description: '', dueDate: '', submissionType: 'all' });
        fetchAssignments();
      } catch (error) {
        console.error('과제 등록 실패:', error);
        alert('과제 등록에 실패했습니다.');
      }
    }
  };

  // 수정 버튼 클릭
  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate.toISOString().split('T')[0],
      submissionType: assignment.submissionType,
    });
    setShowAddModal(true);
  };

  // 과제 삭제
  const handleDeleteAssignment = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'assignments', id));
        alert('과제가 삭제되었습니다.');
        fetchAssignments();
      } catch (error) {
        console.error('과제 삭제 실패:', error);
        alert('과제 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-purple-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">과제 관리</h1>
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
            전체 과제 ({assignments.length}개)
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            + 과제 등록
          </button>
        </div>

        {/* 과제 목록 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">과제명</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">설명</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">제출 방식</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">마감일</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">등록일</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">액션</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    등록된 과제가 없습니다. 과제를 등록해주세요.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => {
                  const submissionTypeLabel = {
                    image: '📷 이미지',
                    link: '🔗 링크',
                    note: '📝 메모',
                    all: '✨ 전체',
                    none: '✅ 체크만',
                  };
                  return (
                    <tr key={assignment.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-800 font-medium">{assignment.title}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {assignment.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                          {submissionTypeLabel[assignment.submissionType || 'all']}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {assignment.dueDate.toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {assignment.createdAt.toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAssignment(assignment)}
                            className="text-blue-500 hover:text-blue-700 font-medium"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* 과제 등록/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {editingAssignment ? '과제 수정' : '과제 등록'}
            </h3>
            <form onSubmit={handleSubmitAssignment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    과제명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="예: 수학문제집 54쪽까지"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    설명 (선택)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="예: 교과서 123-125쪽 문제풀이"
                    rows={3}
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    제출 방식 *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, submissionType: 'image' })}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition ${
                        formData.submissionType === 'image'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      📷 이미지
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, submissionType: 'link' })}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition ${
                        formData.submissionType === 'link'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      🔗 링크
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, submissionType: 'note' })}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition ${
                        formData.submissionType === 'note'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      📝 메모
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, submissionType: 'all' })}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition ${
                        formData.submissionType === 'all'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      ✨ 전체
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, submissionType: 'none' })}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition ${
                        formData.submissionType === 'none'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      ✅ 체크만
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    학생이 과제를 제출할 때 사용할 방식을 선택하세요 (체크만 = 가정통신문 확인 등)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAssignment(null);
                    setFormData({ title: '', description: '', dueDate: '', submissionType: 'all' });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  {editingAssignment ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
