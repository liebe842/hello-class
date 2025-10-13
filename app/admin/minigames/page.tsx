'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import type { MiniGame } from '@/lib/types';

export default function AdminMiniGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<MiniGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const gamesSnapshot = await getDocs(
        query(collection(db, 'minigames'), orderBy('createdAt', 'desc'))
      );
      const gamesData = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as MiniGame[];

      setGames(gamesData);
      setLoading(false);
    } catch (error) {
      console.error('게임 목록 로드 실패:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('이 게임을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'minigames', gameId));
      alert('게임이 삭제되었습니다.');
      fetchGames();
    } catch (error) {
      console.error('게임 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const toggleActive = async (game: MiniGame) => {
    try {
      await updateDoc(doc(db, 'minigames', game.id), {
        isActive: !game.isActive,
      });
      fetchGames();
    } catch (error) {
      console.error('활성화 상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'p5js': return 'p5.js';
      case 'entry': return '엔트리';
      case 'iframe': return '외부 링크';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'p5js': return 'bg-purple-100 text-purple-700';
      case 'entry': return 'bg-blue-100 text-blue-700';
      case 'iframe': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎮 미니게임 관리</h1>
          <div className="flex gap-3">
            <Link
              href="/admin/minigames/create"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              ➕ 게임 등록
            </Link>
            <Link
              href="/admin"
              className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
            >
              돌아가기
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="container mx-auto px-6 py-8">
        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">전체 게임</div>
            <div className="text-3xl font-bold text-blue-600">{games.length}개</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">활성화</div>
            <div className="text-3xl font-bold text-green-600">
              {games.filter(g => g.isActive).length}개
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">총 플레이 횟수</div>
            <div className="text-3xl font-bold text-purple-600">
              {games.reduce((sum, g) => sum + g.playCount, 0)}회
            </div>
          </div>
        </div>

        {/* 게임 목록 */}
        {games.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <div className="text-xl text-gray-600 mb-4">아직 등록된 게임이 없습니다</div>
            <Link
              href="/admin/minigames/create"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              첫 게임 등록하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div
                key={game.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition ${
                  !game.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* 썸네일 */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                  {game.thumbnailUrl ? (
                    <Image
                      src={game.thumbnailUrl}
                      alt={game.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-6xl">
                      🎮
                    </div>
                  )}
                  {!game.isActive && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      비활성
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold ${getTypeColor(game.type)}`}>
                    {getTypeLabel(game.type)}
                  </span>
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{game.title}</h3>
                  {game.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{game.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>by {game.createdByName}</span>
                    <span>🎮 {game.playCount}회</span>
                  </div>

                  {/* 버튼 */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleActive(game)}
                      className={`flex-1 py-2 rounded-lg font-semibold transition ${
                        game.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {game.isActive ? '비활성화' : '활성화'}
                    </button>
                    <Link
                      href={`/kiosk/minigames/${game.id}`}
                      target="_blank"
                      className="flex-1 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-semibold text-center transition"
                    >
                      미리보기
                    </Link>
                    <button
                      onClick={() => handleDelete(game.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
