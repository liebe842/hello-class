'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import type { MiniGame } from '@/lib/types';

// P5Canvas를 동적으로 import (SSR 비활성화)
const P5Canvas = dynamic(() => import('@/components/P5Canvas'), { ssr: false });

export default function PlayMiniGamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<MiniGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    fetchGame();
  }, [gameId]);

  const fetchGame = async () => {
    try {
      const gameDoc = await getDoc(doc(db, 'minigames', gameId));

      if (!gameDoc.exists()) {
        alert('게임을 찾을 수 없습니다.');
        router.push('/kiosk/minigames');
        return;
      }

      const gameData = {
        id: gameDoc.id,
        ...gameDoc.data(),
        createdAt: gameDoc.data().createdAt?.toDate() || new Date(),
      } as MiniGame;

      if (!gameData.isActive) {
        alert('현재 비활성화된 게임입니다.');
        router.push('/kiosk/minigames');
        return;
      }

      setGame(gameData);

      // 플레이 카운트 증가
      await updateDoc(doc(db, 'minigames', gameId), {
        playCount: increment(1),
      });

      setLoading(false);
    } catch (error) {
      console.error('게임 로드 실패:', error);
      alert('게임을 불러오는데 실패했습니다.');
      router.push('/kiosk/minigames');
    }
  };

  const toggleFullscreen = () => {
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">게임을 불러오는 중...</div>
      </div>
    );
  }

  if (!game) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 */}
      <header className="bg-gray-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{game.title}</h1>
            {game.description && (
              <p className="text-sm text-gray-400 mt-1">{game.description}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={toggleFullscreen}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              {isFullscreen ? '전체화면 해제' : '⛶ 전체화면'}
            </button>
            <Link
              href="/kiosk/minigames"
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              목록으로
            </Link>
          </div>
        </div>
      </header>

      {/* 게임 영역 */}
      <main className="flex items-center justify-center px-4 py-4">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full" style={{ maxWidth: '1400px' }}>
          {/* p5.js 게임 */}
          {game.type === 'p5js' && game.p5Code && (
            <P5Canvas code={game.p5Code} width={1400} height={800} />
          )}

          {/* 엔트리 게임 */}
          {game.type === 'entry' && game.gameUrl && (
            <iframe
              src={game.gameUrl}
              width="100%"
              height="800"
              className="border-0"
              style={{ minWidth: '1400px' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* 외부 iframe 게임 */}
          {game.type === 'iframe' && game.gameUrl && (
            <iframe
              src={game.gameUrl}
              width="100%"
              height="800"
              className="border-0"
              style={{ minWidth: '1400px' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </main>

      {/* 게임 정보 */}
      <div className="container mx-auto px-6 pb-8">
        <div className="bg-gray-800 rounded-xl p-6 text-white max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-400">제작자</div>
              <div className="text-lg font-semibold">{game.createdByName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">플레이 횟수</div>
              <div className="text-lg font-semibold text-blue-400">🎮 {game.playCount}회</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">게임 타입</div>
              <div className="text-lg font-semibold">
                {game.type === 'p5js' && '💻 p5.js'}
                {game.type === 'entry' && '🧩 엔트리'}
                {game.type === 'iframe' && '🌐 외부 링크'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
