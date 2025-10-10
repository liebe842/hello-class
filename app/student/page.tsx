'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPage() {
  const router = useRouter();

  useEffect(() => {
    // localStorage에서 학생 세션 확인
    const sessionData = localStorage.getItem('studentSession');

    if (sessionData) {
      // 로그인되어 있으면 대시보드로
      router.push('/student/dashboard');
    } else {
      // 로그인 안 되어 있으면 로그인 페이지로
      router.push('/student/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
      <div className="text-white text-2xl">리다이렉트 중...</div>
    </div>
  );
}
