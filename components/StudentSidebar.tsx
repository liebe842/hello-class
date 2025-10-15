'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface MenuItem {
  icon: string;
  label: string;
  href: string;
}

interface StudentSidebarProps {
  studentName?: string;
  studentInitial?: string;
  profileImageUrl?: string | null;
}

export default function StudentSidebar({ studentName = '학생', studentInitial = 'S', profileImageUrl = null }: StudentSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems: MenuItem[] = [
    { icon: '🏠', label: '대시보드', href: '/student/dashboard' },
    { icon: '🎯', label: '퀴즈', href: '/student/quiz-topics' },
    { icon: '📝', label: '과제', href: '/student/assignments' },
    { icon: '💖', label: '칭찬', href: '/student/praise-list' },
    { icon: '🎯', label: '나의 목표', href: '/student/goals' },
    { icon: '🏅', label: '배지', href: '/student/badges' },
    { icon: '🎫', label: '내 쿠폰함', href: '/student/coupons' },
    { icon: '📊', label: '통계', href: '/student/statistics' },
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👋</span>
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
                      : 'text-purple-100 hover:bg-white hover:text-purple-700'
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-opacity-30 transition flex-shrink-0 overflow-hidden">
                {profileImageUrl ? (
                  <Image src={profileImageUrl} alt="프로필" width={40} height={40} className="rounded-full object-cover w-full h-full" />
                ) : (
                  <span className="text-white font-bold">{studentInitial}</span>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{studentName}</p>
                <p className="text-purple-200 text-xs">학생</p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setShowSettings(true)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                title="설정"
              >
                ⚙️
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('studentSession');
                  window.location.href = '/student/login';
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                title="로그아웃"
              >
                🔓
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">프로필 설정</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 프로필 사진 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">프로필 사진</h3>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-3xl font-bold text-purple-600 overflow-hidden">
                    {profileImage ? (
                      <Image src={profileImage} alt="프로필" width={80} height={80} className="rounded-full object-cover w-full h-full" />
                    ) : (
                      studentInitial
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-medium w-full"
                    >
                      사진 선택
                    </button>
                  </div>
                </div>
                {profileImage && (
                  <button
                    onClick={async () => {
                      if (!profileImage) return;

                      setUploading(true);
                      try {
                        const sessionData = localStorage.getItem('studentSession');
                        if (!sessionData) {
                          alert('로그인 정보를 찾을 수 없습니다.');
                          return;
                        }

                        const student = JSON.parse(sessionData);

                        // Firebase Storage에 업로드
                        const storageRef = ref(storage, `profileImages/${student.id}`);
                        await uploadString(storageRef, profileImage, 'data_url');
                        const downloadURL = await getDownloadURL(storageRef);

                        // Firestore 업데이트
                        const studentRef = doc(db, 'students', student.id);
                        await updateDoc(studentRef, {
                          profileImage: downloadURL
                        });

                        // localStorage 업데이트
                        student.profileImage = downloadURL;
                        localStorage.setItem('studentSession', JSON.stringify(student));

                        alert('프로필 사진이 저장되었습니다.');
                        setProfileImage(null);
                        window.location.reload(); // 사이드바 프로필 이미지 즉시 반영
                      } catch (error) {
                        console.error('프로필 사진 저장 실패:', error);
                        alert('프로필 사진 저장에 실패했습니다.');
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition font-medium"
                    disabled={uploading}
                  >
                    {uploading ? '저장 중...' : '프로필 사진 저장'}
                  </button>
                )}
              </div>

              {/* 비밀번호 변경 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">비밀번호 변경</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      현재 비밀번호
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                      placeholder="현재 비밀번호"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      새 비밀번호
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                      placeholder="새 비밀번호"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                      placeholder="비밀번호 확인"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!currentPassword || !newPassword || !confirmPassword) {
                        alert('모든 필드를 입력해주세요.');
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        alert('새 비밀번호가 일치하지 않습니다.');
                        return;
                      }
                      if (newPassword.length < 4) {
                        alert('비밀번호는 최소 4자 이상이어야 합니다.');
                        return;
                      }

                      try {
                        const sessionData = localStorage.getItem('studentSession');
                        if (!sessionData) {
                          alert('로그인 정보를 찾을 수 없습니다.');
                          return;
                        }

                        const student = JSON.parse(sessionData);

                        // 현재 비밀번호 확인
                        if (student.password !== currentPassword) {
                          alert('현재 비밀번호가 올바르지 않습니다.');
                          return;
                        }

                        // Firebase에서 학생 문서 업데이트
                        const studentRef = doc(db, 'students', student.id);
                        await updateDoc(studentRef, {
                          password: newPassword
                        });

                        // localStorage 업데이트
                        student.password = newPassword;
                        localStorage.setItem('studentSession', JSON.stringify(student));

                        alert('비밀번호가 성공적으로 변경되었습니다.');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setShowSettings(false);
                      } catch (error) {
                        console.error('비밀번호 변경 실패:', error);
                        alert('비밀번호 변경에 실패했습니다.');
                      }
                    }}
                    className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition font-medium"
                  >
                    비밀번호 변경
                  </button>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
