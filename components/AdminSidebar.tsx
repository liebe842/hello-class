'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaChartLine,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaClipboardList,
  FaBullseye,
  FaCoins,
  FaHeart,
  FaGamepad,
  FaCog
} from 'react-icons/fa';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { icon: <FaChartLine />, label: '대시보드', href: '/admin' },
    { icon: <FaChalkboardTeacher />, label: '수업 관리', href: '/admin/classes' },
    { icon: <FaUserGraduate />, label: '학생 관리', href: '/admin/students' },
    { icon: <FaClipboardList />, label: '과제 관리', href: '/admin/assignments' },
    { icon: <FaBullseye />, label: '퀴즈 주제', href: '/admin/quiz-topics' },
    { icon: <FaCoins />, label: '포인트 관리', href: '/admin/points/overview' },
    { icon: <FaHeart />, label: '칭찬 관리', href: '/admin/praise-list' },
    { icon: <FaGamepad />, label: '게임 관리', href: '/admin/minigames' },
    { icon: <FaCog />, label: '설정', href: '/admin/class-config' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-[#1a1a2e] min-h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link href="/admin" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Hello, Class!</h1>
            <p className="text-gray-400 text-xs">관리자 패널</p>
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">T</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">선생님</p>
            <p className="text-gray-400 text-xs">교사</p>
          </div>
          <button className="text-gray-400 hover:text-white">
            <FaCog />
          </button>
        </div>
      </div>
    </div>
  );
}
