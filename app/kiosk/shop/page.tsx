'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, increment, Timestamp, query, where } from 'firebase/firestore';
import type { ShopItem, Student } from '@/lib/types';

export default function KioskShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'time' | 'privilege'>('all');

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

    fetchData(parsedStudent.id);
  }, []);

  const fetchData = async (studentId: string) => {
    try {
      // 상점 아이템 로드 (활성화된 것만)
      const itemsSnap = await getDocs(
        query(collection(db, 'shopItems'), where('isActive', '==', true))
      );
      const itemsData = itemsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as ShopItem[];

      itemsData.sort((a, b) => a.price - b.price);
      setItems(itemsData);

      // 최신 포인트 정보 가져오기
      const studentDocSnap = await getDocs(
        query(collection(db, 'students'), where('__name__', '==', studentId))
      );
      if (!studentDocSnap.empty) {
        const updatedStudent = {
          id: studentDocSnap.docs[0].id,
          ...studentDocSnap.docs[0].data(),
          createdAt: studentDocSnap.docs[0].data().createdAt?.toDate() || new Date(),
        } as Student;
        setStudent(updatedStudent);
        localStorage.setItem('studentSession', JSON.stringify(updatedStudent));
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 아이템 구매
  const handlePurchase = async (item: ShopItem) => {
    if (!student) return;

    if (student.points < item.price) {
      alert('포인트가 부족합니다!');
      return;
    }

    if (!confirm(`"${item.title}"을(를) ${item.price}P에 구매하시겠습니까?`)) return;

    try {
      // 포인트 차감
      await updateDoc(doc(db, 'students', student.id), {
        points: increment(-item.price),
      });

      // 쿠폰 생성 (만료일: 1개월 후)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await addDoc(collection(db, 'coupons'), {
        studentId: student.id,
        studentName: student.name,
        itemId: item.id,
        itemTitle: item.title,
        itemCategory: item.category,
        itemPrice: item.price,
        purchasedAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        status: 'unused',
      });

      // 포인트 내역 기록
      await addDoc(collection(db, 'pointHistory'), {
        studentId: student.id,
        studentName: student.name,
        type: 'spend',
        amount: -item.price,
        source: 'shop',
        description: `${item.title} 구매`,
        createdAt: Timestamp.now(),
      });

      alert('구매가 완료되었습니다! 내 쿠폰함에서 확인하세요.');

      // 포인트 정보 다시 로드
      fetchData(student.id);
    } catch (error) {
      console.error('구매 실패:', error);
      alert('구매에 실패했습니다.');
    }
  };

  // 필터링된 아이템
  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.category === filter);

  // 카테고리 이름
  const getCategoryName = (cat: string) => {
    return cat === 'time' ? '자유시간' : '특권';
  };

  // 카테고리 색상
  const getCategoryColor = (cat: string) => {
    return cat === 'time' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <p className="text-white text-xl">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-gray-900">
      {/* 헤더 */}
      <header className="bg-white bg-opacity-20 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🏪 상점</h1>
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-30 px-4 py-2 rounded-lg font-bold text-white">
              💰 {student.points}P
            </div>
            <Link
              href="/kiosk/home"
              className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              홈으로
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="container mx-auto px-6 py-8">
        {/* 필터 */}
        <div className="mb-6 flex space-x-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              filter === 'all'
                ? 'bg-white shadow-lg'
                : 'bg-white bg-opacity-30 hover:bg-opacity-40'
            }`}
            style={{ color: filter === 'all' ? '#9333ea' : '#ffffff' }}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('time')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              filter === 'time'
                ? 'bg-white shadow-lg'
                : 'bg-white bg-opacity-30 hover:bg-opacity-40'
            }`}
            style={{ color: filter === 'time' ? '#2563eb' : '#ffffff' }}
          >
            ⏰ 자유시간
          </button>
          <button
            onClick={() => setFilter('privilege')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              filter === 'privilege'
                ? 'bg-white shadow-lg'
                : 'bg-white bg-opacity-30 hover:bg-opacity-40'
            }`}
            style={{ color: filter === 'privilege' ? '#9333ea' : '#ffffff' }}
          >
            👑 특권
          </button>
        </div>

        {/* 아이템 목록 */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-2xl p-12 text-center">
            <p className="text-lg font-semibold" style={{ color: '#4b5563' }}>판매 중인 아이템이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => {
              const canBuy = student.points >= item.price;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-xl p-6 hover:shadow-2xl transition border-2 border-gray-100"
                  style={{ color: '#111827' }}
                >
                  {/* 카테고리 배지 */}
                  <div className="mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(item.category)}`}>
                      {getCategoryName(item.category)}
                    </span>
                  </div>

                  {/* 아이템 정보 */}
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#111827' }}>{item.title}</h3>
                  <p className="text-sm mb-4 min-h-[40px]" style={{ color: '#374151' }}>{item.description}</p>
                  <div className="text-3xl font-bold mb-4" style={{ color: '#2563eb' }}>{item.price}P</div>

                  {/* 구매 버튼 */}
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canBuy}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      canBuy
                        ? 'bg-blue-500 hover:bg-blue-600 shadow-md'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                    style={{ color: canBuy ? '#ffffff' : '#4b5563' }}
                  >
                    {canBuy ? '구매하기' : '포인트 부족'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 내 쿠폰함 링크 */}
        <div className="mt-8 text-center">
          <Link
            href="/student/coupons"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-xl"
          >
            🎫 내 쿠폰함 보기
          </Link>
        </div>
      </main>
    </div>
  );
}
