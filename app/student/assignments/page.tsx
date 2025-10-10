'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Webcam from 'react-webcam';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { Student, Assignment } from '@/lib/types';

interface AssignmentSubmission {
  id?: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  isCompleted: boolean;
  submittedAt: Date;
  isLate: boolean;
  imageUrl?: string;
  linkUrl?: string;
  note?: string;
  lastUpdatedAt: Date;
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [loading, setLoading] = useState(true);

  // 제출 모달 상태
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [note, setNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (!sessionData) {
      router.push('/student/login');
      return;
    }

    const studentData = JSON.parse(sessionData) as Student;
    setStudent(studentData);

    fetchData(studentData);
  }, [router]);

  const fetchData = async (studentData: Student) => {
    try {
      // 과제 목록 가져오기
      const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Assignment[];

      // 내 제출 기록 가져오기
      const submissionsRef = collection(db, 'assignmentSubmissions');
      const q = query(submissionsRef, where('studentId', '==', studentData.id));
      const submissionsSnapshot = await getDocs(q);

      const submissionsMap: Record<string, AssignmentSubmission> = {};
      submissionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        submissionsMap[data.assignmentId] = {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate(),
          lastUpdatedAt: data.lastUpdatedAt?.toDate(),
        } as AssignmentSubmission;
      });

      setAssignments(assignmentsData);
      setSubmissions(submissionsMap);
      setLoading(false);
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      setLoading(false);
    }
  };

  const openSubmitModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const existing = submissions[assignment.id];
    if (existing) {
      setCapturedImage(existing.imageUrl || null);
      setLinkUrl(existing.linkUrl || '');
      setNote(existing.note || '');
    }
    setShowSubmitModal(true);
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !student) return;

    setIsUploading(true);
    try {
      const now = new Date();
      const isLate = now > selectedAssignment.dueDate;

      let imageUrl = capturedImage || '';

      // 이미지 업로드 (있는 경우)
      if (capturedImage && capturedImage.startsWith('data:')) {
        const timestamp = Date.now();
        const storageRef = ref(
          storage,
          `assignments/${selectedAssignment.id}/${student.id}_${timestamp}.jpg`
        );
        await uploadString(storageRef, capturedImage, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      }

      const submissionData = {
        assignmentId: selectedAssignment.id,
        studentId: student.id,
        studentName: student.name,
        isCompleted: true,
        submittedAt: Timestamp.fromDate(now),
        isLate,
        imageUrl,
        linkUrl,
        note,
        lastUpdatedAt: Timestamp.fromDate(now),
      };

      const existingSubmission = submissions[selectedAssignment.id];

      if (existingSubmission?.id) {
        // 수정
        await updateDoc(doc(db, 'assignmentSubmissions', existingSubmission.id), submissionData);
      } else {
        // 새로 제출
        await addDoc(collection(db, 'assignmentSubmissions'), submissionData);
      }

      alert('과제가 제출되었습니다!');
      setShowSubmitModal(false);
      setCapturedImage(null);
      setLinkUrl('');
      setNote('');

      // 데이터 새로고침
      if (student) fetchData(student);
    } catch (error) {
      console.error('과제 제출 실패:', error);
      alert('과제 제출에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500">
      {/* 헤더 */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">📝 나의 과제</h1>
          <Link
            href="/student/dashboard"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            대시보드로
          </Link>
        </div>
      </header>

      {/* 메인 */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">등록된 과제가 없습니다.</p>
            </div>
          ) : (
            assignments.map((assignment) => {
              const submission = submissions[assignment.id];
              const isSubmitted = submission?.isCompleted;
              const isLate = submission?.isLate;

              return (
                <div
                  key={assignment.id}
                  className={`bg-white rounded-xl shadow-md p-6 ${
                    isSubmitted ? 'border-2 border-green-500' : 'border-2 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {assignment.title}
                        {isSubmitted && (
                          <span className="ml-3 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            ✅ 제출 완료
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 mb-3">{assignment.description}</p>
                      <p className="text-sm text-gray-500">
                        마감: {assignment.dueDate.toLocaleDateString('ko-KR')}
                      </p>

                      {isSubmitted && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            제출: {submission.submittedAt.toLocaleString('ko-KR')}
                            {isLate && (
                              <span className="ml-2 text-red-600 font-semibold">🔴 지각</span>
                            )}
                          </p>
                          {submission.imageUrl && (
                            <p className="text-sm text-gray-600 mt-1">📷 이미지 첨부됨</p>
                          )}
                          {submission.linkUrl && (
                            <p className="text-sm text-gray-600">🔗 링크: {submission.linkUrl}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openSubmitModal(assignment)}
                      className={`ml-4 px-6 py-3 rounded-lg font-semibold transition ${
                        isSubmitted
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                      }`}
                    >
                      {isSubmitted ? '수정하기' : '제출하기'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 제출 모달 */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              {selectedAssignment.title}
            </h3>

            <div className="space-y-6">
              {/* 사진 업로드 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📸 과제물 사진 (선택)
                </label>
                {!capturedImage ? (
                  <div>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full rounded-lg mb-3"
                    />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg"
                    >
                      📷 사진 촬영
                    </button>
                  </div>
                ) : (
                  <div>
                    <img src={capturedImage} alt="촬영된 사진" className="w-full rounded-lg mb-3" />
                    <button
                      type="button"
                      onClick={() => setCapturedImage(null)}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg"
                    >
                      다시 촬영
                    </button>
                  </div>
                )}
              </div>

              {/* 링크 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔗 링크 (선택)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="https://..."
                />
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 메모 (선택)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  rows={3}
                  placeholder="메모를 입력하세요..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isUploading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg disabled:bg-gray-400"
              >
                {isUploading ? '제출 중...' : '✅ 제출하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
