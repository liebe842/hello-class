'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Student, Assignment, StudentGoal } from '@/lib/types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [loading, setLoading] = useState(true);

  // 목표 관련 상태
  const [goals, setGoals] = useState<StudentGoal[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetCount, setGoalTargetCount] = useState(10);
  const [goalUnit, setGoalUnit] = useState('회');
  const [goalEndDate, setGoalEndDate] = useState('');
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);

  // 제출 모달 상태
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      setImagePreview(existing.imageUrl || null);
      setLinkUrl(existing.linkUrl || '');
      setNote(existing.note || '');
    }
    setShowSubmitModal(true);
  };

  // 모달이 열릴 때 전역 붙여넣기 이벤트 리스너 추가
  useEffect(() => {
    if (!showSubmitModal) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
            e.preventDefault();
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [showSubmitModal]);

  // 이미지 파일 처리 (공통 함수)
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      // 이미지 압축 옵션
      const options = {
        maxSizeMB: 1, // 최대 1MB
        maxWidthOrHeight: 1920, // 최대 1920px
        useWebWorker: true,
        fileType: file.type,
      };

      // 이미지 압축
      const compressedFile = await imageCompression(file, options);

      console.log('원본 크기:', (file.size / 1024).toFixed(2), 'KB');
      console.log('압축 후 크기:', (compressedFile.size / 1024).toFixed(2), 'KB');

      setImageFile(compressedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('이미지 압축 실패:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // 드래그 오버 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 드롭 핸들러
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Ctrl+V 붙여넣기 핸들러
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
          e.preventDefault();
        }
        break;
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !student) return;

    setIsUploading(true);
    try {
      const now = new Date();
      const isLate = now > selectedAssignment.dueDate;

      let imageUrl = imagePreview || '';

      // 이미지 업로드 (새 파일이 있는 경우)
      if (imageFile) {
        const timestamp = Date.now();
        const fileName = `assignments/${selectedAssignment.id}/${student.id}_${timestamp}_${imageFile.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
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

        // 기한 내 제출 시 포인트 지급 (5P)
        if (!isLate) {
          await updateDoc(doc(db, 'students', student.id), {
            points: increment(5),
          });

          await addDoc(collection(db, 'pointHistory'), {
            studentId: student.id,
            studentName: student.name,
            type: 'earn',
            amount: 5,
            source: 'assignment',
            description: `${selectedAssignment.title} 제출`,
            createdAt: Timestamp.now(),
          });
        }
      }

      alert(isLate ? '과제가 제출되었습니다!' : '과제가 제출되었습니다! 🎉 +5P');
      setShowSubmitModal(false);
      setImageFile(null);
      setImagePreview(null);
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
              {/* 체크만 하는 과제 안내 */}
              {selectedAssignment && selectedAssignment.submissionType === 'none' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    확인 제출 과제입니다
                  </p>
                  <p className="text-sm text-gray-600">
                    별도의 파일이나 내용 제출 없이 &quot;제출하기&quot; 버튼만 클릭하면 완료됩니다.
                  </p>
                </div>
              )}

              {/* 사진 업로드 (제출 방식에 따라 표시) */}
              {selectedAssignment && (selectedAssignment.submissionType === 'image' || selectedAssignment.submissionType === 'all') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📸 과제물 이미지 {selectedAssignment.submissionType === 'image' ? '*' : '(선택)'}
                  </label>
                  {!imagePreview ? (
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onPaste={handlePaste}
                      tabIndex={0}
                      className="outline-none"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 rounded-lg p-8 text-center transition cursor-pointer"
                      >
                        <div className="text-4xl mb-2">📷</div>
                        <div className="text-sm text-gray-700 font-semibold mb-2">
                          이미지 업로드 (최대 5MB)
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>• 클릭해서 파일 선택</div>
                          <div>• 드래그 앤 드롭</div>
                          <div>• 캡처 후 Ctrl+V로 붙여넣기</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Image src={imagePreview} alt="업로드된 이미지" width={800} height={600} className="w-full rounded-lg mb-3 object-contain max-h-96 bg-gray-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg"
                      >
                        다시 선택
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 링크 입력 (제출 방식에 따라 표시) */}
              {selectedAssignment && (selectedAssignment.submissionType === 'link' || selectedAssignment.submissionType === 'all') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔗 링크 {selectedAssignment.submissionType === 'link' ? '*' : '(선택)'}
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="https://..."
                    required={selectedAssignment.submissionType === 'link'}
                  />
                </div>
              )}

              {/* 메모 (제출 방식에 따라 표시) */}
              {selectedAssignment && (selectedAssignment.submissionType === 'note' || selectedAssignment.submissionType === 'all') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📝 메모 {selectedAssignment.submissionType === 'note' ? '*' : '(선택)'}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                    rows={3}
                    placeholder="메모를 입력하세요..."
                    required={selectedAssignment.submissionType === 'note'}
                  />
                </div>
              )}
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
