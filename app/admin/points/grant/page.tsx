'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, Timestamp, increment, query, orderBy } from 'firebase/firestore';
import type { Student } from '@/lib/types';

export default function AdminPointGrantPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [pointAmount, setPointAmount] = useState(0);
  const [isDeduct, setIsDeduct] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 학생 목록 로드
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsSnap = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Student[];

      // 정렬
      studentsData.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        if (a.class !== b.class) return a.class - b.class;
        return a.number - b.number;
      });

      setStudents(studentsData);
    } catch (error) {
      console.error('학생 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 포인트 지급/차감
  const handleGrant = async () => {
    if (!selectedStudentId) {
      alert('학생을 선택해주세요.');
      return;
    }

    if (pointAmount <= 0) {
      alert('포인트는 0보다 커야 합니다.');
      return;
    }

    if (!reason.trim()) {
      alert('사유를 입력해주세요.');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    // 차감 시 잔액 확인
    if (isDeduct && student.points < pointAmount) {
      alert('포인트가 부족합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalAmount = isDeduct ? -pointAmount : pointAmount;

      // 포인트 업데이트
      await updateDoc(doc(db, 'students', selectedStudentId), {
        points: increment(finalAmount),
      });

      // 포인트 내역 기록
      await addDoc(collection(db, 'pointHistory'), {
        studentId: selectedStudentId,
        studentName: student.name,
        type: isDeduct ? 'spend' : 'earn',
        amount: finalAmount,
        source: 'admin',
        description: reason.trim(),
        createdAt: Timestamp.now(),
      });

      alert(`${isDeduct ? '차감' : '지급'}되었습니다!`);

      // 초기화
      setSelectedStudentId('');
      setPointAmount(0);
      setReason('');
      fetchStudents();
    } catch (error) {
      console.error('포인트 처리 실패:', error);
      alert('포인트 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">포인트 지급/차감</h1>
        <p className="text-gray-600">학생에게 포인트를 지급하거나 차감합니다</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8">
            {/* 지급/차감 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                유형 선택 *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsDeduct(false)}
                  className={`py-2 rounded-lg border-2 font-semibold transition ${
                    !isDeduct
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  포인트 지급
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeduct(true)}
                  className={`py-2 rounded-lg border-2 font-semibold transition ${
                    isDeduct
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 text-gray-600 hover:border-red-300'
                  }`}
                >
                  포인트 차감
                </button>
              </div>
            </div>

            {/* 학생 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                학생 선택 *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">학생을 선택하세요</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.grade}학년 {student.class}반 {student.number}번 {student.name} (보유: {student.points || 0}P)
                  </option>
                ))}
              </select>
            </div>

            {/* 포인트 금액 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                포인트 금액 *
              </label>
              <input
                type="number"
                value={pointAmount}
                onChange={(e) => setPointAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                placeholder="포인트 입력"
              />
            </div>

            {/* 사유 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                사유 *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="예: 수업 중 적극적인 참여"
              />
            </div>

            {/* 버튼 */}
            <button
              onClick={handleGrant}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                isDeduct
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-50`}
            >
              {isSubmitting
                ? '처리 중...'
                : isDeduct
                ? '포인트 차감하기'
                : '포인트 지급하기'
              }
            </button>
          </div>
        </div>
    </div>
  );
}
