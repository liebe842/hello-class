'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Student, Assignment } from '@/lib/types';

interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  isCompleted: boolean;
  submittedAt: Date;
  isLate: boolean;
  imageUrl?: string;
  linkUrl?: string;
  note?: string;
}

interface StudentSubmissionData {
  student: Student;
  submission?: AssignmentSubmission;
}

export default function AdminAssignmentSubmissionsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 과제 목록
      const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Assignment[];

      // 학생 목록
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Student[];

      // 제출 현황
      const submissionsSnapshot = await getDocs(collection(db, 'assignmentSubmissions'));
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
      })) as AssignmentSubmission[];

      setAssignments(assignmentsData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
      setStudents(studentsData.sort((a, b) => a.name.localeCompare(b.name)));
      setSubmissions(submissionsData);

      if (assignmentsData.length > 0) {
        setSelectedAssignmentId(assignmentsData[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      setLoading(false);
    }
  };

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  // 선택된 과제의 학생별 제출 데이터
  const studentSubmissions: StudentSubmissionData[] = students.map(student => {
    const submission = submissions.find(
      s => s.assignmentId === selectedAssignmentId && s.studentId === student.id
    );
    return { student, submission };
  });

  // 통계 계산
  const stats = {
    total: students.length,
    completed: studentSubmissions.filter(s => s.submission?.isCompleted).length,
    onTime: studentSubmissions.filter(s => s.submission?.isCompleted && !s.submission.isLate).length,
    late: studentSubmissions.filter(s => s.submission?.isCompleted && s.submission.isLate).length,
    notSubmitted: studentSubmissions.filter(s => !s.submission?.isCompleted).length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">📊 과제 제출 현황</h1>
          <Link
            href="/admin"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            관리자 홈
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">등록된 과제가 없습니다.</p>
            <Link
              href="/admin/assignments"
              className="inline-block mt-4 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
            >
              과제 등록하기
            </Link>
          </div>
        ) : (
          <>
            {/* 과제 선택 탭 */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex gap-3 overflow-x-auto">
                {assignments.map(assignment => (
                  <button
                    key={assignment.id}
                    onClick={() => setSelectedAssignmentId(assignment.id)}
                    className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
                      selectedAssignmentId === assignment.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {assignment.title}
                  </button>
                ))}
              </div>
            </div>

            {selectedAssignment && (
              <>
                {/* 통계 카드 */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">제출률</p>
                    <p className="text-3xl font-bold text-blue-600">{completionRate}%</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">전체 학생</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.total}명</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">정시 제출</p>
                    <p className="text-3xl font-bold text-green-600">{stats.onTime}명</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">지각 제출</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.late}명</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">미제출</p>
                    <p className="text-3xl font-bold text-red-600">{stats.notSubmitted}명</p>
                  </div>
                </div>

                {/* 과제 정보 */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedAssignment.title}</h2>
                  <p className="text-gray-600 mb-3">{selectedAssignment.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-700">
                      <strong>마감일:</strong> {selectedAssignment.dueDate.toLocaleDateString('ko-KR')}
                    </span>
                    {selectedAssignment.canvaUrl && (
                      <a
                        href={selectedAssignment.canvaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        📎 Canva 링크
                      </a>
                    )}
                  </div>
                </div>

                {/* 제출 현황 테이블 */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">학생</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">상태</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">제출 시간</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">사진</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">링크</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">메모</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">상세</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {studentSubmissions.map(({ student, submission }) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-800">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.grade}학년 {student.class}반 {student.number}번</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {submission?.isCompleted ? (
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                  submission.isLate
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {submission.isLate ? '🔴 지각 제출' : '✅ 제출 완료'}
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                                ❌ 미제출
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {submission?.submittedAt ? (
                              <div className="text-sm">
                                <p className="text-gray-800">
                                  {submission.submittedAt.toLocaleDateString('ko-KR')}
                                </p>
                                <p className="text-gray-500">
                                  {submission.submittedAt.toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {submission?.imageUrl ? (
                              <img
                                src={submission.imageUrl}
                                alt="제출 사진"
                                className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                onClick={() => setSelectedSubmission(submission)}
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {submission?.linkUrl ? (
                              <a
                                href={submission.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                링크 보기
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {submission?.note ? (
                              <p className="text-sm text-gray-700 truncate max-w-xs">
                                {submission.note}
                              </p>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {submission?.isCompleted && (
                              <button
                                onClick={() => setSelectedSubmission(submission)}
                                className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                              >
                                자세히
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* 상세보기 모달 */}
        {selectedSubmission && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSubmission(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedSubmission.studentName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      제출 시간: {selectedSubmission.submittedAt.toLocaleString('ko-KR')}
                    </p>
                    {selectedSubmission.isLate && (
                      <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                        🔴 지각 제출
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* 제출 사진 */}
                {selectedSubmission.imageUrl && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">제출 사진</h4>
                    <img
                      src={selectedSubmission.imageUrl}
                      alt="제출 사진"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}

                {/* 링크 */}
                {selectedSubmission.linkUrl && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">제출 링크</h4>
                    <a
                      href={selectedSubmission.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {selectedSubmission.linkUrl}
                    </a>
                  </div>
                )}

                {/* 메모 */}
                {selectedSubmission.note && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">메모</h4>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {selectedSubmission.note}
                    </p>
                  </div>
                )}

                {!selectedSubmission.imageUrl && !selectedSubmission.linkUrl && !selectedSubmission.note && (
                  <p className="text-gray-500 text-center py-8">
                    추가 제출 내용이 없습니다.
                  </p>
                )}

                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
