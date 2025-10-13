'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Student, PointHistory } from '@/lib/types';

export default function StudentPointsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [histories, setHistories] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all');

  useEffect(() => {
    // 학생 세션 확인
    const studentData = localStorage.getItem('studentSession');
    if (!studentData) {
      alert('로그인이 필요합니다.');
      window.location.href = '/kiosk';
      return;
    }

    const parsedStudent = JSON.parse(studentData) as Student;
    setStudent(parsedStudent);

    fetchData(parsedStudent.id);
  }, []);

  const fetchData = async (studentId: string) => {
    try {
      // 최신 포인트 정보
      const studentDocSnap = await getDocs(
        query(collection(db, 'students'), where('__name__', '==', studentId))
      );
      if (!studentDocSnap.empty) {
        const updatedStudent = {
          id: studentDocSnap.docs[0].id,
          ...studentDocSnap.docs[0].data(),
          createdAt: studentDocSnap.docs[0].data().createdAt?.toDate() || new Date(),
        } as Student;
        setStudent(updatedStudent);
      }

      // 포인트 내역
      const q = query(
        collection(db, 'pointHistory'),
        where('studentId', '==', studentId)
      );
      const historiesSnap = await getDocs(q);
      const historiesData = historiesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PointHistory[];

      historiesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setHistories(historiesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 내역
  const filteredHistories = filter === 'all'
    ? histories
    : histories.filter(h => h.type === filter);

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

  // 출처 아이콘
  const getSourceIcon = (source: string) => {
    const map: Record<string, string> = {
      assignment: '📝',
      praise_received: '💝',
      praise_given: '💖',
      goal: '🎯',
      attendance: '📅',
      admin: '👨‍🏫',
      shop: '🛒',
    };
    return map[source] || '💰';
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const totalEarned = histories
    .filter(h => h.type === 'earn')
    .reduce((sum, h) => sum + h.amount, 0);

  const totalSpent = histories
    .filter(h => h.type === 'spend')
    .reduce((sum, h) => sum + Math.abs(h.amount), 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">💰 포인트 내역</h1>
          <Link
            href="/student/dashboard"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            대시보드
          </Link>
        </div>
      </header>

      {/* 메인 */}
      <main className="container mx-auto px-6 py-8">
        {/* 포인트 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm mb-1 opacity-80">현재 포인트</div>
            <div className="text-4xl font-bold">{student.points}P</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm mb-1 opacity-80">총 획득</div>
            <div className="text-4xl font-bold">+{totalEarned}P</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-sm mb-1 opacity-80">총 사용</div>
            <div className="text-4xl font-bold">-{totalSpent}P</div>
          </div>
        </div>

        {/* 필터 */}
        <div className="mb-6 flex space-x-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            전체 ({histories.length})
          </button>
          <button
            onClick={() => setFilter('earn')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              filter === 'earn'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            획득 ({histories.filter(h => h.type === 'earn').length})
          </button>
          <button
            onClick={() => setFilter('spend')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              filter === 'spend'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            사용 ({histories.filter(h => h.type === 'spend').length})
          </button>
        </div>

        {/* 내역 목록 */}
        {filteredHistories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">포인트 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredHistories.map(history => (
                <div
                  key={history.id}
                  className="p-4 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getSourceIcon(history.source)}</div>
                    <div>
                      <div className="font-semibold text-gray-800">{getSourceName(history.source)}</div>
                      <div className="text-sm text-gray-600">{history.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {history.createdAt.toLocaleDateString('ko-KR')} {history.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    history.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {history.amount > 0 ? '+' : ''}{history.amount}P
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
