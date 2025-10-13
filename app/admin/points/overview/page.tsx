'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch, query, where, orderBy } from 'firebase/firestore';
import type { Student, PointHistory } from '@/lib/types';

export default function AdminPointsOverviewPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pointHistories, setPointHistories] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [filteredHistories, setFilteredHistories] = useState<PointHistory[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 학생 목록
      const studentsSnap = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Student[];

      studentsData.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        if (a.class !== b.class) return a.class - b.class;
        return a.number - b.number;
      });

      // 포인트 내역
      const historiesSnap = await getDocs(collection(db, 'pointHistory'));
      const historiesData = historiesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PointHistory[];

      historiesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setStudents(studentsData);
      setPointHistories(historiesData);
      setFilteredHistories(historiesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 학생 필터링
  useEffect(() => {
    if (selectedStudentId) {
      setFilteredHistories(pointHistories.filter(h => h.studentId === selectedStudentId));
    } else {
      setFilteredHistories(pointHistories);
    }
  }, [selectedStudentId, pointHistories]);

  // 포인트 리셋
  const handleResetPoints = async () => {
    const confirmed = confirm(
      '⚠️ 모든 학생의 포인트를 0으로 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
    );
    if (!confirmed) return;

    const doubleConfirm = confirm('정말로 초기화하시겠습니까?');
    if (!doubleConfirm) return;

    try {
      const batch = writeBatch(db);

      students.forEach(student => {
        const studentRef = doc(db, 'students', student.id);
        batch.update(studentRef, { points: 0 });
      });

      await batch.commit();
      alert('모든 학생의 포인트가 초기화되었습니다.');
      fetchData();
    } catch (error) {
      console.error('포인트 초기화 실패:', error);
      alert('초기화에 실패했습니다.');
    }
  };

  // 출처 이름
  const getSourceName = (source: string) => {
    const map: Record<string, string> = {
      assignment: '과제 제출',
      praise_received: '칭찬 받기',
      praise_given: '칭찬 주기',
      goal: '목표 달성',
      attendance: '출석',
      admin: '선생님 지급',
      shop: '상점 구매',
    };
    return map[source] || source;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">포인트 현황</h1>
        <p className="text-gray-600">전체 학생의 포인트 잔액과 내역을 확인합니다</p>
      </div>
      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">총 학생 수</div>
          <div className="text-3xl font-bold text-blue-600">{students.length}명</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">총 포인트</div>
          <div className="text-3xl font-bold text-blue-600">{totalPoints}P</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">평균 포인트</div>
          <div className="text-3xl font-bold text-blue-600">
            {students.length > 0 ? Math.round(totalPoints / students.length) : 0}P
          </div>
        </div>
      </div>

      {/* 리셋 버튼 */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleResetPoints}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
        >
          전체 포인트 초기화
        </button>
      </div>

      {/* 학생별 포인트 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">학생별 포인트 잔액</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">학년/반/번호</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">이름</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">포인트</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.grade}학년 {student.class}반 {student.number}번
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{student.name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">
                      {student.points || 0}P
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* 포인트 내역 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">포인트 내역</h2>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">전체 학생</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.grade}학년 {student.class}반 {student.number}번 {student.name}
                </option>
              ))}
            </select>
          </div>

          {filteredHistories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">포인트 내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">날짜</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">학생</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">출처</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">내용</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">포인트</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredHistories.slice(0, 100).map(history => (
                    <tr key={history.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {history.createdAt.toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{history.studentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getSourceName(history.source)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{history.description}</td>
                      <td className={`px-4 py-3 text-sm font-bold text-right ${
                        history.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {history.amount > 0 ? '+' : ''}{history.amount}P
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHistories.length > 100 && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  최근 100개만 표시됩니다.
                </p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
