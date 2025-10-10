'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function StudentLoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Firestore에서 학생 정보 확인
      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef,
        where('name', '==', name),
        where('password', '==', password)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('학생 정보를 찾을 수 없습니다. 이름과 비밀번호를 확인해주세요.');
        setLoading(false);
        return;
      }

      // 학생 정보를 localStorage에 저장
      const studentData = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      };
      localStorage.setItem('studentSession', JSON.stringify(studentData));

      // 학생 페이지로 이동
      router.push('/student/dashboard');
    } catch (error) {
      console.error('로그인 실패:', error);
      setError('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">학생 로그인</h1>
          <p className="text-gray-600">나의 대시보드에 접속하세요</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              이름 *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg text-gray-900 placeholder-gray-400"
              placeholder="예: 홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              비밀번호 (4자리) *
            </label>
            <input
              type="password"
              required
              maxLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg text-gray-900 placeholder-gray-400"
              placeholder="예: 1234"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg py-4 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800">
            💡 <strong>안내:</strong> 관리자가 등록한 이름과 비밀번호(4자리)로 로그인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
