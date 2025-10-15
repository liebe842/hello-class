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
}

interface StudentProgress {
  student: Student;
  completedAssignments: Set<string>;
  completionRate: number;
}

export default function KioskAssignmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'incomplete'>('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // 학생 목록
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Student[];

      // 과제 목록
      const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Assignment[];

      // 제출 현황
      const submissionsSnapshot = await getDocs(collection(db, 'assignmentSubmissions'));
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
      })) as AssignmentSubmission[];

      setStudents(studentsData);
      setAssignments(assignmentsData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
      setSubmissions(submissionsData);
      setLoading(false);
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      setLoading(false);
    }
  };

  // 각 과제별 완료율 계산
  const getAssignmentProgress = (assignmentId: string) => {
    if (students.length === 0) return 0;
    const completedCount = submissions.filter(
      s => s.assignmentId === assignmentId && s.isCompleted
    ).length;
    return Math.round((completedCount / students.length) * 100);
  };

  // 학생별 진행도 계산
  const studentProgressList: StudentProgress[] = students.map(student => {
    const completedAssignments = new Set(
      submissions
        .filter(s => s.studentId === student.id && s.isCompleted)
        .map(s => s.assignmentId)
    );
    const completionRate = assignments.length > 0
      ? Math.round((completedAssignments.size / assignments.length) * 100)
      : 0;
    return { student, completedAssignments, completionRate };
  });

  // 필터링 및 정렬된 학생 목록 (학년 → 반 → 번호 순)
  const filteredStudents = (viewMode === 'incomplete'
    ? studentProgressList.filter(sp => sp.completionRate < 100)
    : studentProgressList
  ).sort((a, b) => {
    if (a.student.grade !== b.student.grade) return a.student.grade - b.student.grade;
    if (a.student.class !== b.student.class) return a.student.class - b.student.class;
    return a.student.number - b.student.number;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
        <div className="text-white text-3xl font-bold">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-8">
      {/* 헤더 */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">📝 과제 현황</h1>
          <Link
            href="/kiosk"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition text-lg font-semibold"
          >
            키오스크 홈
          </Link>
        </div>

        {/* 탭 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition ${
              viewMode === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체 현황 보기
          </button>
          <button
            onClick={() => setViewMode('incomplete')}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition ${
              viewMode === 'incomplete'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            미완료 학생만 보기
          </button>
        </div>

        {/* 과제별 진행률 */}
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">등록된 과제가 없습니다.</div>
          ) : (
            assignments.map(assignment => {
              const progress = getAssignmentProgress(assignment.id);
              return (
                <div key={assignment.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800 text-lg">{assignment.title}</h3>
                    <span className="text-purple-600 font-bold text-lg">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 flex items-center justify-center text-white text-sm font-semibold"
                      style={{ width: `${progress}%` }}
                    >
                      {progress > 10 && `${progress}%`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 학생 카드 그리드 */}
      <div className="grid grid-cols-4 gap-6">
        {filteredStudents.length === 0 ? (
          <div className="col-span-4 bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-xl">
              {viewMode === 'incomplete' ? '모든 학생이 과제를 완료했습니다! 🎉' : '등록된 학생이 없습니다.'}
            </p>
          </div>
        ) : (
          filteredStudents.map(({ student, completedAssignments, completionRate }) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
            >
              {/* 학생 이름 */}
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{student.name}</h3>
                <p className="text-sm text-gray-500">{student.grade}학년 {student.class}반 {student.number}번</p>
              </div>

              {/* 과제 체크박스 */}
              <div className="space-y-3 mb-4">
                {assignments.map(assignment => {
                  const isCompleted = completedAssignments.has(assignment.id);
                  const submission = submissions.find(
                    s => s.assignmentId === assignment.id && s.studentId === student.id
                  );
                  const isLate = submission?.isLate;

                  return (
                    <div
                      key={assignment.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isCompleted ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-500'
                        }`}
                      >
                        {isCompleted && '✓'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {assignment.title}
                        </p>
                        {isLate && (
                          <p className="text-xs text-red-600 font-semibold">🔴 지각</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 완료율 */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600">완료율</span>
                  <span className="text-lg font-bold text-purple-600">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
