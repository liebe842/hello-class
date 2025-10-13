'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import type { ClassConfig } from '@/lib/types';

export default function ClassConfigPage() {
  const [classConfig, setClassConfig] = useState<ClassConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    grade: '',
    classNumber: '',
    teacherName: '',
  });

  useEffect(() => {
    fetchClassConfig();
  }, []);

  const fetchClassConfig = async () => {
    try {
      const configSnap = await getDocs(collection(db, 'classConfig'));
      if (!configSnap.empty) {
        const configData = {
          id: configSnap.docs[0].id,
          ...configSnap.docs[0].data(),
          updatedAt: configSnap.docs[0].data().updatedAt?.toDate() || new Date(),
        } as ClassConfig;
        setClassConfig(configData);
        setFormData({
          schoolName: configData.schoolName || '',
          grade: configData.grade || '',
          classNumber: configData.classNumber || '',
          teacherName: configData.teacherName || '',
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const configData = {
        schoolName: formData.schoolName,
        grade: formData.grade,
        classNumber: formData.classNumber,
        teacherName: formData.teacherName,
        updatedAt: new Date(),
      };

      if (classConfig) {
        // 업데이트
        await updateDoc(doc(db, 'classConfig', classConfig.id), configData);
      } else {
        // 새로 생성
        await addDoc(collection(db, 'classConfig'), configData);
      }

      alert('학급 정보가 저장되었습니다.');
      fetchClassConfig();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">학급 정보 설정</h1>
        <p className="text-gray-600">학급의 기본 정보를 설정합니다.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학교명
            </label>
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 한빛초등학교"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학년
              </label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                반
              </label>
              <input
                type="text"
                name="classNumber"
                value={formData.classNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 3"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              담임교사명
            </label>
            <input
              type="text"
              name="teacherName"
              value={formData.teacherName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 홍길동"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <Link
              href="/admin/classes"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition inline-block"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
