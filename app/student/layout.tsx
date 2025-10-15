'use client';

import StudentSidebar from '@/components/StudentSidebar';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [studentName, setStudentName] = useState('학생');
  const [studentInitial, setStudentInitial] = useState('S');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 키오스크 모드 체크: 특정 페이지이면서 kiosk 파라미터가 있을 때만 사이드바 숨김
  const kioskPages = ['/student/quiz-topics', '/student/leaderboard'];
  const isKioskPage = kioskPages.some(page => pathname?.startsWith(page));
  const isKioskMode = searchParams?.get('kiosk') === 'true';
  const shouldHideSidebar = isKioskPage && isKioskMode;

  useEffect(() => {
    const sessionData = localStorage.getItem('studentSession');
    if (sessionData) {
      const student = JSON.parse(sessionData);
      setStudentName(student.name || '학생');
      setStudentInitial(student.name ? student.name[0] : 'S');
      setProfileImage(student.profileImage || null);
    }
  }, []);

  // 사이드바 숨김 모드 (키오스크에서만)
  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  // 기본 레이아웃 (사이드바 포함)
  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar
        studentName={studentName}
        studentInitial={studentInitial}
        profileImageUrl={profileImage}
      />
      <main className="flex-1 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
