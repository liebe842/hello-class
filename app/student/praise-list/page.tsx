'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import type { Student, Praise, PraiseCategory } from '@/lib/types';

const CATEGORY_LABELS: Record<PraiseCategory, string> = {
  kindness: '친절함',
  diligence: '성실함',
  cooperation: '협동심',
  creativity: '창의성',
  leadership: '리더십',
  responsibility: '책임감',
  respect: '배려심',
  effort: '노력',
  improvement: '발전',
  positive: '긍정적 태도',
};

const CATEGORY_COLORS: Record<PraiseCategory, string> = {
  kindness: 'bg-pink-100 text-pink-700',
  diligence: 'bg-blue-100 text-blue-700',
  cooperation: 'bg-green-100 text-green-700',
  creativity: 'bg-purple-100 text-purple-700',
  leadership: 'bg-yellow-100 text-yellow-700',
  responsibility: 'bg-indigo-100 text-indigo-700',
  respect: 'bg-rose-100 text-rose-700',
  effort: 'bg-orange-100 text-orange-700',
  improvement: 'bg-teal-100 text-teal-700',
  positive: 'bg-lime-100 text-lime-700',
};

const CATEGORY_EMOJIS: Record<PraiseCategory, string> = {
  kindness: '💖',
  diligence: '📚',
  cooperation: '🤝',
  creativity: '🎨',
  leadership: '👑',
  responsibility: '💪',
  respect: '🌟',
  effort: '🔥',
  improvement: '📈',
  positive: '😊',
};

export default function StudentPraiseListPage() {
  const router = useRouter();
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [receivedPraises, setReceivedPraises] = useState<Praise[]>([]);
  const [sentPraises, setSentPraises] = useState<Praise[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'received' | 'sent'>('received');

  // 칭찬 통계
  const [stats, setStats] = useState({
    totalReceived: 0,
    byCategory: {} as Record<PraiseCategory, number>,
    topCategory: '' as PraiseCategory | '',
  });

  useEffect(() => {
    // 로그인한 학생 정보 가져오기
    const studentData = localStorage.getItem('studentSession');
    if (!studentData) {
      alert('로그인이 필요합니다.');
      router.push('/student/login');
      return;
    }

    const student = JSON.parse(studentData);
    setCurrentStudent(student);

    fetchPraises(student.id);
  }, [router]);

  const fetchPraises = async (studentId: string) => {
    try {
      // 받은 칭찬
      const receivedSnap = await getDocs(
        query(
          collection(db, 'praises'),
          where('toId', '==', studentId),
          orderBy('createdAt', 'desc')
        )
      );
      const receivedData = receivedSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Praise[];

      // 보낸 칭찬
      const sentSnap = await getDocs(
        query(
          collection(db, 'praises'),
          where('fromId', '==', studentId),
          orderBy('createdAt', 'desc')
        )
      );
      const sentData = sentSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Praise[];

      setReceivedPraises(receivedData);
      setSentPraises(sentData);
      calculateStats(receivedData);
      setLoading(false);
    } catch (err) {
      console.error('칭찬 목록 로드 실패:', err);
      setLoading(false);
    }
  };

  const calculateStats = (praisesData: Praise[]) => {
    // 카테고리별 통계
    const byCategory: Record<PraiseCategory, number> = {
      kindness: 0,
      diligence: 0,
      cooperation: 0,
      creativity: 0,
      leadership: 0,
      responsibility: 0,
      respect: 0,
      effort: 0,
      improvement: 0,
      positive: 0,
    };

    praisesData.forEach(praise => {
      byCategory[praise.category]++;
    });

    // 가장 많이 받은 카테고리
    const topCategoryEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry && topCategoryEntry[1] > 0 ? topCategoryEntry[0] as PraiseCategory : '';

    setStats({
      totalReceived: praisesData.length,
      byCategory,
      topCategory,
    });
  };

  if (loading || !currentStudent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-800 text-2xl">로딩 중...</div>
      </div>
    );
  }

  const displayPraises = viewMode === 'received' ? receivedPraises : sentPraises;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">✨ 내 칭찬</h1>
              <p className="text-gray-600">받은 칭찬과 보낸 칭찬을 확인할 수 있습니다.</p>
            </div>
            <button
              onClick={() => router.push('/student/praise')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-lg hover:from-pink-600 hover:to-rose-600 transition"
            >
              ✨ 칭찬하기
            </button>
          </div>
        </div>

        {/* 통계 (받은 칭찬일 때만 표시) */}
        {viewMode === 'received' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">받은 칭찬</div>
              <div className="text-3xl font-bold text-pink-600">{stats.totalReceived}개</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">나의 강점</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.topCategory ? (
                  <>
                    {CATEGORY_EMOJIS[stats.topCategory]} {CATEGORY_LABELS[stats.topCategory]}
                  </>
                ) : (
                  '-'
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {stats.topCategory ? `${stats.byCategory[stats.topCategory]}번 칭찬받음` : '칭찬을 받아보세요!'}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">보낸 칭찬</div>
              <div className="text-3xl font-bold text-blue-600">{sentPraises.length}개</div>
            </div>
          </div>
        )}

        {/* 카테고리별 통계 (받은 칭찬일 때만 표시) */}
        {viewMode === 'received' && stats.totalReceived > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 카테고리별 칭찬</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(Object.keys(CATEGORY_LABELS) as PraiseCategory[]).map((cat) => {
                const count = stats.byCategory[cat];
                if (count === 0) return null;
                return (
                  <div key={cat} className="text-center">
                    <div className="text-3xl mb-1">{CATEGORY_EMOJIS[cat]}</div>
                    <div className="text-sm font-semibold text-gray-700">{CATEGORY_LABELS[cat]}</div>
                    <div className="text-2xl font-bold text-pink-600">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 탭 전환 */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setViewMode('received')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              viewMode === 'received'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            받은 칭찬 ({receivedPraises.length})
          </button>
          <button
            onClick={() => setViewMode('sent')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              viewMode === 'sent'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            보낸 칭찬 ({sentPraises.length})
          </button>
        </div>

        {/* 칭찬 목록 */}
        {displayPraises.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">😊</div>
            <div className="text-xl text-gray-600">
              {viewMode === 'received' ? '아직 받은 칭찬이 없습니다.' : '아직 보낸 칭찬이 없습니다.'}
            </div>
            <div className="text-gray-500 mt-2">
              {viewMode === 'received' ? '친구들과 선생님께 칭찬을 받아보세요!' : '친구들과 선생님을 칭찬해보세요!'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayPraises.map((praise) => (
              <div
                key={praise.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-l-4 border-pink-400"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{CATEGORY_EMOJIS[praise.category]}</span>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${CATEGORY_COLORS[praise.category]}`}>
                        {CATEGORY_LABELS[praise.category]}
                      </span>
                      {!praise.isPublic && (
                        <span className="ml-2 px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-700">
                          🔒 나만 보기
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-2 font-semibold">
                    {viewMode === 'received' ? (
                      <>
                        <span className="text-pink-600">{praise.fromName}</span>님이 칭찬했어요
                      </>
                    ) : (
                      <>
                        <span className="text-pink-600">{praise.toName}</span>님에게 보낸 칭찬
                      </>
                    )}
                  </div>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-pink-50 p-4 rounded-lg">
                    &quot;{praise.content}&quot;
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  {praise.createdAt.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
