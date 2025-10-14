'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface MenuItem {
  icon: string;
  label: string;
  href: string;
}

interface StudentSidebarProps {
  studentName?: string;
  studentInitial?: string;
}

export default function StudentSidebar({ studentName = '학생', studentInitial = 'S' }: StudentSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { icon: '🏠', label: '대시보드', href: '/student/dashboard' },
    { icon: '🎯', label: '퀴즈', href: '/student/quiz-topics' },
    { icon: '📝', label: '과제', href: '/student/assignments' },
    { icon: '✨', label: '칭찬하기', href: '/student/praise' },
    { icon: '💖', label: '받은 칭찬', href: '/student/praise-list' },
    { icon: '🎯', label: '나의 목표', href: '/student/goals' },
    { icon: '📊', label: '통계', href: '/student/statistics' },
    { icon: '🏆', label: '리더보드', href: '/student/leaderboard' },
    { icon: '🏅', label: '배지', href: '/student/badges' },
  ];

  const isActive = (href: string) => {
    if (href === '/student/dashboard') {
      return pathname === '/student/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-purple-600 text-white p-3 rounded-lg shadow-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`w-64 bg-gradient-to-b from-purple-600 to-purple-800 min-h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-40 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-purple-500 border-opacity-30">
          <Link href="/student/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Hello, Class!</h1>
              <p className="text-purple-200 text-xs">학생 대시보드</p>
            </div>
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-white text-purple-700 shadow-lg font-semibold'
                      : 'text-purple-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-purple-500 border-opacity-30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold">{studentInitial}</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{studentName}</p>
              <p className="text-purple-200 text-xs">학생</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
