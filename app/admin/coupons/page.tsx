'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, Timestamp, query, where, orderBy } from 'firebase/firestore';
import type { Coupon } from '@/lib/types';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unused' | 'pending' | 'approved' | 'expired'>('pending');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const couponsSnap = await getDocs(collection(db, 'coupons'));
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

  // 쿠폰 승인
  const handleApprove = async (coupon: Coupon) => {
    if (!confirm(`${coupon.studentName} 학생의 "${coupon.itemTitle}" 쿠폰을 승인하시겠습니까?`)) return;

    try {
      await updateDoc(doc(db, 'coupons', coupon.id), {
        status: 'approved',
        usedAt: Timestamp.now(),
      });

      alert('승인되었습니다.');
      fetchCoupons();
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인에 실패했습니다.');
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
      pending: '사용대기',
      approved: '사용완료',
      expired: '기간만료',
    };
    return map[status] || status;
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      unused: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const pendingCount = coupons.filter(c => c.status === 'pending').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">쿠폰 관리</h1>
        <p className="text-gray-600">학생들이 구매한 쿠폰을 관리하고 승인합니다</p>
      </div>
      {/* 통계 */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-800">
            <strong>승인 대기 중인 쿠폰이 {pendingCount}개 있습니다.</strong>
          </p>
        </div>
      )}

      {/* 필터 */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          전체 ({coupons.length})
        </button>
        <button
          onClick={() => setFilter('unused')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'unused'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          미사용 ({coupons.filter(c => c.status === 'unused').length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'pending'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          사용대기 ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'approved'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          사용완료 ({coupons.filter(c => c.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'expired'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          기간만료 ({coupons.filter(c => c.status === 'expired').length})
        </button>
      </div>

      {/* 쿠폰 목록 */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">해당하는 쿠폰이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">학생</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">아이템</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">카테고리</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">구매일</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">만료일</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCoupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                    {coupon.studentName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{coupon.itemTitle}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getCategoryName(coupon.itemCategory)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {coupon.purchasedAt.toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {coupon.expiresAt.toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(coupon.status)}`}>
                      {getStatusName(coupon.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {coupon.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(coupon)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        승인
                      </button>
                    )}
                    {coupon.status === 'approved' && coupon.usedAt && (
                      <span className="text-xs text-gray-500">
                        {coupon.usedAt.toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
