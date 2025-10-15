'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function KioskMiniGamesPage() {
  useEffect(() => {
    // 컴포넌트 마운트 시 즉시 게임 페이지로 리다이렉트
    window.location.href = '/kiosk/minigames/play';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="text-white text-2xl">게임 로딩 중...</div>
    </div>
  );
}
