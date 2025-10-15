'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import type { Praise, PraiseCategory } from '@/lib/types';

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

export default function TeacherPraisePage() {
  const router = useRouter();
  const [praises, setPraises] = useState<Praise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PraiseCategory | 'all'>('all');

  // 칭찬 통계
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {} as Record<PraiseCategory, number>,
    topSender: { name: '', count: 0 },
  });

  useEffect(() => {
    fetchTeacherPraises();
  }, []);

  const fetchTeacherPraises = async () => {
    try {
      // 선생님에게 온 칭찬만 필터링
      const praisesQuery = query(
        collection(db, 'praises'),
        where('toType', '==', 'teacher'),
        orderBy('createdAt', 'desc')
      );

      const praisesSnap = await getDocs(praisesQuery);
      const praisesData = praisesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Praise[];

      setPraises(praisesData);
      calculateStats(praisesData);
      setLoading(false);
    } catch (err) {
      console.error('선생님 칭찬 목록 로드 실패:', err);
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

    // 가장 많이 칭찬한 학생
    const senderCounts: Record<string, { name: string; count: number }> = {};
    praisesData.forEach(praise => {
      if (!senderCounts[praise.fromId]) {
        senderCounts[praise.fromId] = { name: praise.fromName, count: 0 };
      }
      senderCounts[praise.fromId].count++;
    });

    const topSender = Object.values(senderCounts).sort((a, b) => b.count - a.count)[0] || { name: '-', count: 0 };

    setStats({
      total: praisesData.length,
      byCategory,
      topSender,
    });
  };

  // 필터링된 칭찬 목록
  const filteredPraises = praises.filter(praise => {
    if (selectedCategory !== 'all' && praise.category !== selectedCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            ← 돌아가기
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">💐 선생님께 받은 칭찬</h1>
              <p className="text-gray-600">학생들이 선생님께 보낸 따뜻한 마음을 확인해보세요.</p>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">받은 칭찬</div>
            <div className="text-3xl font-bold text-purple-600">{stats.total}개</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">가장 많은 칭찬</div>
            <div className="text-2xl font-bold text-pink-600">
              {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0]
                ? CATEGORY_LABELS[Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0][0] as PraiseCategory]
                : '-'
              }
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0]?.[1] || 0}건
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">가장 많이 보낸 학생</div>
            <div className="text-2xl font-bold text-blue-600">{stats.topSender.name}</div>
            <div className="text-sm text-gray-500 mt-1">{stats.topSender.count}개 보냄</div>
          </div>
        </div>

        {/* 카테고리별 분포 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">카테고리별 분포</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(CATEGORY_LABELS) as PraiseCategory[]).map((cat) => (
              <div
                key={cat}
                className={`p-4 rounded-lg text-center transition ${CATEGORY_COLORS[cat]}`}
              >
                <div className="text-2xl font-bold mb-1">{stats.byCategory[cat]}</div>
                <div className="text-xs font-medium">{CATEGORY_LABELS[cat]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">칭찬 목록</h2>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PraiseCategory | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">모든 카테고리</option>
              {(Object.keys(CATEGORY_LABELS) as PraiseCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]} ({stats.byCategory[cat]}건)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 칭찬 목록 */}
        {filteredPraises.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🌟</div>
            <div className="text-xl text-gray-600">아직 받은 칭찬이 없습니다.</div>
            <div className="text-gray-500 mt-2">학생들의 따뜻한 칭찬을 기다려보세요!</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPraises.map((praise) => (
              <div
                key={praise.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${CATEGORY_COLORS[praise.category]}`}>
                      {CATEGORY_LABELS[praise.category]}
                    </span>
                    {!praise.isPublic && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-700">
                        🔒 비공개
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-bold text-lg text-purple-600">✨ {praise.fromName}</span>
                    <span className="text-gray-500 ml-2">학생으로부터</span>
                  </div>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-purple-50 p-4 rounded-lg">
                    {praise.content}
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
