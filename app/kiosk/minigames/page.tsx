'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy as firestoreOrderBy } from 'firebase/firestore';
import type { MiniGame } from '@/lib/types';

export default function KioskMiniGamesPage() {
  const [games, setGames] = useState<MiniGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const gamesSnapshot = await getDocs(
        query(
          collection(db, 'minigames'),
          where('isActive', '==', true)
        )
      );

      const gamesData = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as MiniGame[];

      // 클라이언트에서 정렬
      gamesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setGames(gamesData);
      setLoading(false);
    } catch (error) {
      console.error('게임 목록 로드 실패:', error);
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'p5js': return '💻 p5.js';
      case 'entry': return '🧩 엔트리';
      case 'iframe': return '🌐 외부 링크';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'p5js': return 'bg-purple-500 text-white';
      case 'entry': return 'bg-blue-500 text-white';
      case 'iframe': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-2xl">게임 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600">
      {/* 헤더 */}
      <header className="bg-black bg-opacity-30 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">🎮 미니게임 센터</h1>
              <p className="text-white text-opacity-80">재미있는 게임을 즐겨보세요!</p>
            </div>
            <Link
              href="/kiosk"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-xl font-bold transition backdrop-blur-sm"
            >
              ← 키오스크 홈
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="container mx-auto px-6 py-8">
        {games.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-12">
              <div className="text-8xl mb-6">🎮</div>
              <div className="text-3xl font-bold text-white mb-2">아직 게임이 없습니다</div>
              <div className="text-xl text-white text-opacity-80">선생님이 곧 추가할 거예요!</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <Link key={game.id} href={`/kiosk/minigames/${game.id}`}>
                <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer group">
                  {/* 썸네일 */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                    {game.thumbnailUrl ? (
                      <Image
                        src={game.thumbnailUrl}
                        alt={game.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-7xl group-hover:scale-110 transition-transform duration-300">
                        🎮
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-sm font-bold ${getTypeColor(game.type)}`}>
                      {getTypeLabel(game.type)}
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                      {game.title}
                    </h3>
                    {game.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {game.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">by {game.createdByName}</span>
                      <span className="flex items-center text-purple-600 font-semibold">
                        <span className="mr-1">🎮</span>
                        {game.playCount}회
                      </span>
                    </div>

                    {/* 플레이 버튼 */}
                    <div className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-3 rounded-lg font-bold group-hover:from-blue-600 group-hover:to-purple-600 transition">
                      ▶ 게임 시작하기
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="container mx-auto px-6 py-6 mt-8">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center text-white">
          <p className="text-lg font-semibold mb-2">🎉 총 {games.length}개의 게임이 있습니다!</p>
          <p className="text-sm text-white text-opacity-70">새로운 게임이 계속 추가됩니다</p>
        </div>
      </footer>
    </div>
  );
}
