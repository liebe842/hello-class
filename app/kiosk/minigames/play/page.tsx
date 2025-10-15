'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function KioskMiniGamePlayPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 */}
      <header className="bg-gray-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🎮 AI 동작 인식 게임</h1>
            <p className="text-sm text-gray-400 mt-1">카메라를 사용하는 인공지능 게임입니다</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={toggleFullscreen}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              {isFullscreen ? '전체화면 해제' : '⛶ 전체화면'}
            </button>
            <Link
              href="/kiosk"
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              키오스크로
            </Link>
          </div>
        </div>
      </header>

      {/* 게임 영역 */}
      <main className="flex items-center justify-center p-4">
        <div className="w-full max-w-7xl">
          <iframe
            src="https://editor.p5js.org/liebe842/full/Pge-6zk3c"
            width="100%"
            height="900"
            className="border-0 rounded-xl shadow-2xl bg-white"
            allow="camera; microphone; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </main>

      {/* 안내 메시지 */}
      <div className="container mx-auto px-6 pb-8">
        <div className="bg-gray-800 rounded-xl p-6 text-white max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📷</div>
            <div>
              <h3 className="font-bold text-lg mb-2">카메라 권한 안내</h3>
              <p className="text-sm text-gray-300">
                이 게임은 카메라를 사용하여 여러분의 동작을 인식합니다.
                브라우저에서 카메라 권한 요청이 나타나면 <strong>'허용'</strong>을 눌러주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
