'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import type { Student, Coupon } from '@/lib/types';

export default function StudentCouponsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unused' | 'pending' | 'approved' | 'expired'>('unused');

  useEffect(() => {
    // 학생 세션 확인
    const studentData = localStorage.getItem('studentSession');
    if (!studentData) {
      alert('로그인이 필요합니다.');
      window.location.href = '/kiosk';
      return;
    }

    const parsedStudent = JSON.parse(studentData) as Student;
    setStudent(parsedStudent);

    fetchCoupons(parsedStudent.id);
  }, []);

  const fetchCoupons = async (studentId: string) => {
    try {
      const q = query(
        collection(db, 'coupons'),
        where('studentId', '==', studentId)
      );
      const couponsSnap = await getDocs(q);
      const couponsData = couponsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        purchasedAt: doc.data().purchasedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date(),
        usedAt: doc.data().usedAt?.toDate(),
      })) as Coupon[];

      // 만료된 쿠폰 자동 처리
      const now = new Date();
      const batch: Promise<void>[] = [];

      couponsData.forEach(coupon => {
        if (coupon.status !== 'expired' && coupon.expiresAt < now) {
          batch.push(
            updateDoc(doc(db, 'coupons', coupon.id), { status: 'expired' })
          );
          coupon.status = 'expired';
        }
      });

      await Promise.all(batch);

      couponsData.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
      setCoupons(couponsData);
    } catch (error) {
      console.error('쿠폰 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 쿠폰 사용 요청
  const handleUse = async (coupon: Coupon) => {
    if (!confirm(`"${coupon.itemTitle}" 쿠폰을 사용하시겠습니까?\n선생님께 승인을 요청합니다.`)) return;

    try {
      await updateDoc(doc(db, 'coupons', coupon.id), {
        status: 'pending',
      });

      alert('선생님께 승인 요청을 보냈습니다!');
      if (student) fetchCoupons(student.id);
    } catch (error) {
      console.error('사용 요청 실패:', error);
      alert('사용 요청에 실패했습니다.');
    }
  };

  // 필터링된 쿠폰
  const filteredCoupons = filter === 'all'
    ? coupons
    : coupons.filter(c => c.status === filter);

  // 카테고리 이름
  const getCategoryName = (category: string) => {
    return category === 'time' ? '자유시간' : '특권';
  };

  // 상태 이름
  const getStatusName = (status: string) => {
    const map: Record<string, string> = {
      unused: '미사용',
      pending: '승인대기',
      approved: '사용완료',
      expired: '기간만료',
    };
    return map[status] || status;
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      unused: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-gray-100 text-gray-700',
      expired: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const unusedCount = coupons.filter(c => c.status === 'unused').length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-purple-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎫 내 쿠폰함</h1>
          <Link
            href="/student/dashboard"
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            대시보드
          </Link>
        </div>
      </header>

      {/* 메인 */}
      <main className="container mx-auto px-6 py-8">
        {/* 안내 */}
        {unusedCount > 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-800">
              <strong>🎉 사용 가능한 쿠폰이 {unusedCount}개 있습니다!</strong>
            </p>
          </div>
        )}

        {/* 필터 */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            전체 ({coupons.length})
          </button>
          <button
            onClick={() => setFilter('unused')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'unused'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            미사용 ({unusedCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            승인대기 ({coupons.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'approved'
                ? 'bg-gray-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            사용완료 ({coupons.filter(c => c.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'expired'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            기간만료 ({coupons.filter(c => c.status === 'expired').length})
          </button>
        </div>

        {/* 쿠폰 목록 */}
        {filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">해당하는 쿠폰이 없습니다.</p>
            <Link
              href="/kiosk/shop"
              className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              상점 가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map(coupon => (
              <div
                key={coupon.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                {/* 상태 배지 */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(coupon.status)}`}>
                    {getStatusName(coupon.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getCategoryName(coupon.itemCategory)}
                  </span>
                </div>

                {/* 쿠폰 정보 */}
                <h3 className="text-lg font-bold text-gray-800 mb-2">{coupon.itemTitle}</h3>
                <div className="text-2xl font-bold text-purple-600 mb-4">{coupon.itemPrice}P</div>

                {/* 날짜 정보 */}
                <div className="text-xs text-gray-500 mb-4">
                  <div>구매일: {coupon.purchasedAt.toLocaleDateString('ko-KR')}</div>
                  <div>만료일: {coupon.expiresAt.toLocaleDateString('ko-KR')}</div>
                  {coupon.usedAt && (
                    <div>사용일: {coupon.usedAt.toLocaleDateString('ko-KR')}</div>
                  )}
                </div>

                {/* 버튼 */}
                {coupon.status === 'unused' && (
                  <button
                    onClick={() => handleUse(coupon)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition"
                  >
                    사용하기
                  </button>
                )}
                {coupon.status === 'pending' && (
                  <div className="w-full bg-yellow-100 text-yellow-700 py-2 rounded-lg font-semibold text-center">
                    선생님 승인 대기 중
                  </div>
                )}
                {coupon.status === 'approved' && (
                  <div className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold text-center">
                    사용 완료
                  </div>
                )}
                {coupon.status === 'expired' && (
                  <div className="w-full bg-red-100 text-red-700 py-2 rounded-lg font-semibold text-center">
                    기간 만료
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
