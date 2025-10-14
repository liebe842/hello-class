'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, Timestamp } from 'firebase/firestore';
import type { NeisSettings } from '@/lib/types';

export default function AdminNeisSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Omit<NeisSettings, 'id' | 'updatedAt'>>({
    atptOfcdcScCode: '',
    sdSchulCode: '',
    schoolName: '',
    apiKey: '',
  });

  useEffect(() => {
    fetchSettings().then(() => setLoading(false));
  }, []);

  const fetchSettings = async () => {
    try {
      const snap = await getDocs(collection(db, 'neisSettings'));
      if (snap.docs.length > 0) {
        const data = snap.docs[0].data() as Omit<NeisSettings, 'id'>;
        setSettings({
          atptOfcdcScCode: data.atptOfcdcScCode || '',
          sdSchulCode: data.sdSchulCode || '',
          schoolName: data.schoolName || '',
          apiKey: data.apiKey || '',
        });
      }
    } catch (err) {
      console.error('설정 불러오기 실패:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settings.atptOfcdcScCode || !settings.sdSchulCode || !settings.schoolName || !settings.apiKey) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      await setDoc(doc(db, 'neisSettings', 'current'), {
        ...settings,
        updatedAt: Timestamp.now()
      });

      alert('NEIS 설정이 저장되었습니다!');
    } catch (err) {
      console.error('저장 실패:', err);
      alert('설정 저장에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏫 NEIS API 설정</h1>
          <Link
            href="/admin"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            관리자 홈
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 안내 */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h3 className="font-bold text-blue-900 mb-2">📋 NEIS API 설정 안내</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>
                <a
                  href="https://open.neis.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  NEIS 오픈API
                </a>
                에서 회원가입 및 API 인증키 발급
              </li>
              <li>학교 정보는 NEIS 사이트의 &quot;학교기본정보&quot; API에서 검색</li>
              <li>아래 정보를 입력하고 저장</li>
            </ol>
          </div>

          {/* 설정 폼 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">학교 정보 설정</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  학교명 *
                </label>
                <input
                  type="text"
                  required
                  value={settings.schoolName}
                  onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서울초등학교"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  시도교육청코드 *
                </label>
                <input
                  type="text"
                  required
                  value={settings.atptOfcdcScCode}
                  onChange={(e) => setSettings({ ...settings, atptOfcdcScCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: B10 (서울)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  서울:B10, 부산:C10, 대구:D10, 인천:E10, 광주:F10, 대전:G10, 울산:H10, 세종:I10, 경기:J10
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  학교코드 *
                </label>
                <input
                  type="text"
                  required
                  value={settings.sdSchulCode}
                  onChange={(e) => setSettings({ ...settings, sdSchulCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 7001234"
                />
                <p className="text-xs text-gray-500 mt-1">
                  10자리 학교 고유 코드 (NEIS 학교기본정보에서 확인)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NEIS API 인증키 *
                </label>
                <input
                  type="text"
                  required
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="NEIS API 인증키 입력"
                />
                <p className="text-xs text-gray-500 mt-1">
                  open.neis.go.kr에서 발급받은 인증키
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
              >
                저장하기
              </button>
            </form>
          </div>

          {/* 참고 링크 */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-2">📚 참고 자료</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • <a href="https://open.neis.go.kr/portal/data/service/selectServicePage.do?page=1&rows=10&sortColumn=&sortDirection=&infId=OPEN17320190722175817128697&infSeq=2" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  급식 메뉴 API 명세
                </a>
              </li>
              <li>
                • <a href="https://open.neis.go.kr/portal/data/service/selectServicePage.do?page=1&rows=10&sortColumn=&sortDirection=&infId=OPEN17220190722180924242823&infSeq=2" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  학교 기본 정보 API 명세
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
