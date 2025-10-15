'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Student } from '@/lib/types';

export default function LeaderboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKioskMode = searchParams?.get('kiosk') === 'true';
  const [leaderboard, setLeaderboard] = useState<Student[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const studentData =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('studentSession') || '{}')
      : {};

  useEffect(() => {
    if (!studentData.id) {
      alert('로그인이 필요합니다.');
      router.push('/student/login');
      return;
    }
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];

      const sortedStudents = [...students].sort(
        (a, b) => (b.points || 0) - (a.points || 0)
      );
      setLeaderboard(sortedStudents);

      const myRankIndex = sortedStudents.findIndex(s => s.id === studentData.id);
      setMyRank(myRankIndex !== -1 ? myRankIndex + 1 : null);

      setLoading(false);
    } catch (err) {
      console.error('리더보드 불러오기 실패:', err);
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}위`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${
        isKioskMode ? 'min-h-screen bg-gradient-to-br from-green-400 to-blue-500' : ''
      }`}>
        <div className={isKioskMode ? 'text-white text-2xl' : 'text-gray-600'}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={isKioskMode ? 'min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-8' : 'p-8'}>
      {isKioskMode && (
        <Link href="/kiosk" className="mb-4 inline-block bg-white px-6 py-3 rounded-lg font-semibold text-gray-800 hover:bg-gray-100 transition">
          ← 돌아가기
        </Link>
      )}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isKioskMode ? 'text-white' : 'text-gray-800'}`}>🎯 포인트 리더보드</h1>
        <p className={`text-sm mt-1 ${isKioskMode ? 'text-white' : 'text-gray-600'}`}>
          친구들의 포인트 순위를 확인해 보세요. 꾸준한 활동이 높은 순위를
          만들어 줍니다!
        </p>
        {myRank && !isKioskMode && (
          <div className="mt-3 inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold">
            <span>내 순위</span>
            <span className="text-lg">{getRankBadge(myRank)}</span>
            <span>{studentData.name}</span>
          </div>
        )}
      </div>

      <main>
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                아직 포인트를 획득한 친구가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((student, index) => {
                  const isMe = student.id === studentData.id;
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                        isMe
                          ? 'bg-emerald-50 border-emerald-400'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold w-16 text-center">
                          {getRankBadge(index + 1)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 flex items-center gap-2">
                            {student.name}
                            {isMe && (
                              <span className="text-xs font-semibold bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">
                                나
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {student.grade}학년 {student.class}반 {student.number}번
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">보유 포인트</p>
                        <p className="text-xl font-bold text-emerald-600">
                          {student.points || 0} XP
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {!isKioskMode && (
          <div className="mt-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl p-6 shadow-lg flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">포인트를 더 모으고 싶나요?</h2>
              <p className="text-sm opacity-90">
                과제를 성실히 제출하고 친구들에게 칭찬을 남기면 포인트가 쑥쑥
                올라갑니다. 일찍 출석하면 보너스 포인트도 있어요!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/student/assignments')}
                className="bg-white text-purple-600 font-semibold px-4 py-2 rounded-lg shadow hover:bg-purple-100 transition"
              >
                과제 보러 가기
              </button>
              <button
                onClick={() => router.push('/student/praise')}
                className="bg-white text-purple-600 font-semibold px-4 py-2 rounded-lg shadow hover:bg-purple-100 transition"
              >
                친구 칭찬하기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
