'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import type { ShopItem, ShopCategory } from '@/lib/types';

export default function AdminShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

  // 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ShopCategory>('time');
  const [price, setPrice] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // 아이템 로드
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'shopItems'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as ShopItem[];
      setItems(itemsData);
    } catch (error) {
      console.error('아이템 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 모달 열기 (새 아이템)
  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setCategory('time');
    setPrice(0);
    setIsActive(true);
    setShowModal(true);
  };

  // 모달 열기 (수정)
  const openEditModal = (item: ShopItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setPrice(item.price);
    setIsActive(item.isActive);
    setShowModal(true);
  };

  // 아이템 저장
  const handleSave = async () => {
    if (!title.trim()) {
      alert('아이템 이름을 입력해주세요.');
      return;
    }

    if (price <= 0) {
      alert('가격은 0보다 커야 합니다.');
      return;
    }

    try {
      if (editingItem) {
        // 수정
        await updateDoc(doc(db, 'shopItems', editingItem.id), {
          title: title.trim(),
          description: description.trim(),
          category,
          price,
          isActive,
        });
        alert('아이템이 수정되었습니다.');
      } else {
        // 새로 생성
        await addDoc(collection(db, 'shopItems'), {
          title: title.trim(),
          description: description.trim(),
          category,
          price,
          isActive,
          createdAt: Timestamp.now(),
        });
        alert('아이템이 등록되었습니다.');
      }

      setShowModal(false);
      fetchItems();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  // 아이템 삭제
  const handleDelete = async (item: ShopItem) => {
    if (!confirm(`"${item.title}" 아이템을 삭제하시겠습니까?`)) return;

    try {
      await deleteDoc(doc(db, 'shopItems', item.id));
      alert('삭제되었습니다.');
      fetchItems();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // 카테고리 이름
  const getCategoryName = (cat: ShopCategory) => {
    return cat === 'time' ? '자유시간' : '특권';
  };

  // 카테고리 색상
  const getCategoryColor = (cat: ShopCategory) => {
    return cat === 'time' ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">상점 아이템 관리</h1>
        <p className="text-gray-600">학생들이 포인트로 구매할 수 있는 상점 아이템을 관리합니다</p>
      </div>

      {/* 등록 버튼 */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={openCreateModal}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
        >
          아이템 등록
        </button>
      </div>

        {/* 아이템 목록 */}
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">등록된 아이템이 없습니다.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
            >
              첫 아이템 등록하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-md p-6">
                {/* 상태 배지 */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item.category)}`}>
                    {getCategoryName(item.category)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.isActive ? '판매중' : '판매중지'}
                  </span>
                </div>

                {/* 아이템 정보 */}
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                <div className="text-2xl font-bold text-blue-600 mb-4">{item.price}P</div>

                {/* 버튼 */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg font-semibold transition"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-semibold transition"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingItem ? '아이템 수정' : '새 아이템 등록'}
            </h2>

            {/* 아이템 이름 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                아이템 이름 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 자유시간 10분"
              />
            </div>

            {/* 설명 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="아이템에 대한 설명..."
              />
            </div>

            {/* 카테고리 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                카테고리 *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory('time')}
                  className={`py-2 rounded-lg border-2 font-semibold transition ${
                    category === 'time'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  자유시간
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('privilege')}
                  className={`py-2 rounded-lg border-2 font-semibold transition ${
                    category === 'privilege'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  특권
                </button>
              </div>
            </div>

            {/* 가격 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                가격 (포인트) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            {/* 판매 상태 */}
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm font-semibold text-gray-700">판매 중</span>
              </label>
            </div>

            {/* 버튼 */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
