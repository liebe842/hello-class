'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Assignment, Student } from '@/lib/types';

interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  isCompleted: boolean;
  submittedAt: Date;
  isLate: boolean;
}

export default function AssignmentSubmissionStatus() {
  const [viewMode, setViewMode] = useState<'by-assignment' | 'by-student'>('by-assignment');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsSnap, studentsSnap, submissionsSnap] = await Promise.all([
        getDocs(collection(db, 'assignments')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'assignmentSubmissions')),
      ]);

      const assignmentsData = assignmentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Assignment[];

      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Student[];

      const submissionsData = submissionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
      })) as AssignmentSubmission[];

      setAssignments(assignmentsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setStudents(studentsData.sort((a, b) => a.number - b.number));
      setSubmissions(submissionsData);
      setLoading(false);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 h-[500px] flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // 과제별 보기
  const renderByAssignment = () => {
    const recentAssignments = assignments.slice(0, 5);

    if (recentAssignments.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          등록된 과제가 없습니다.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {recentAssignments.map(assignment => {
          const totalStudents = students.length;
          const submittedCount = submissions.filter(
            s => s.assignmentId === assignment.id && s.isCompleted
          ).length;
          const submissionRate = totalStudents > 0
            ? Math.round((submittedCount / totalStudents) * 100)
            : 0;

          return (
            <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">{assignment.title}</h4>
                  <p className="text-xs text-gray-500">
                    마감: {assignment.dueDate.toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{submissionRate}%</div>
                  <div className="text-xs text-gray-500">{submittedCount}/{totalStudents}명</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${submissionRate}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 학생별 보기
  const renderByStudent = () => {
    if (students.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          등록된 학생이 없습니다.
        </div>
      );
    }

    const studentStats = students.map(student => {
      const totalAssignments = assignments.length;
      const submittedCount = submissions.filter(
        s => s.studentId === student.id && s.isCompleted
      ).length;
      const submissionRate = totalAssignments > 0
        ? Math.round((submittedCount / totalAssignments) * 100)
        : 0;

      return { student, totalAssignments, submittedCount, submissionRate };
    });

    return (
      <div className="space-y-3">
        {studentStats.map(({ student, totalAssignments, submittedCount, submissionRate }) => (
          <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{student.name}</h4>
                <p className="text-xs text-gray-500">
                  {student.grade}학년 {student.class}반 {student.number}번
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  submissionRate >= 80 ? 'text-green-600' :
                  submissionRate >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {submissionRate}%
                </div>
                <div className="text-xs text-gray-500">{submittedCount}/{totalAssignments}개</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  submissionRate >= 80 ? 'bg-green-600' :
                  submissionRate >= 50 ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}
                style={{ width: `${submissionRate}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 h-[500px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">과제 제출 현황</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('by-assignment')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              viewMode === 'by-assignment'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            과제별
          </button>
          <button
            onClick={() => setViewMode('by-student')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              viewMode === 'by-student'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            학생별
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {viewMode === 'by-assignment' ? renderByAssignment() : renderByStudent()}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <a
          href="/admin/assignment-submissions"
          className="block text-center text-sm text-blue-600 hover:text-blue-800 font-semibold"
        >
          전체 보기 →
        </a>
      </div>
    </div>
  );
}
