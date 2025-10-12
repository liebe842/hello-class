'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc, Timestamp } from 'firebase/firestore';
import type { Timetable } from '@/lib/types';

export default function AdminTimetablePage() {
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<{[key: string]: string}>({});
  const [pasteText, setPasteText] = useState('');
  const [previewData, setPreviewData] = useState<{[key: string]: string} | null>(null);

  const days = ['월', '화', '수', '목', '금'];
  const periods = [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    fetchTimetable().then(() => setLoading(false));
  }, []);

  const fetchTimetable = async () => {
    try {
      const snap = await getDocs(collection(db, 'timetable'));
      if (snap.docs.length > 0) {
        const data = snap.docs[0].data() as Omit<Timetable, 'id'>;
        setTimetable(data.schedule || {});
      }
    } catch (err) {
      console.error('시간표 불러오기 실패:', err);
    }
  };

  // 표 붙여넣기 파싱
  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      alert('붙여넣을 내용을 입력해주세요.');
      return;
    }

    try {
      const lines = pasteText.trim().split('\n').filter(line => line.trim());
      const parsed: {[key: string]: string} = {};

      if (lines.length < 2) {
        alert('최소 2줄(헤더 + 데이터) 이상이어야 합니다.');
        return;
      }

      // 첫 줄은 헤더 (요일)
      const headerLine = lines[0].split('\t').map(s => s.trim());
      const dayHeaders = headerLine.filter(h => h && h !== '교시' && h !== ''); // 빈칸, "교시" 제외

      console.log('헤더:', dayHeaders);

      // 나머지 줄은 각 교시
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split('\t').map(s => s.trim());

        // 첫 번째 셀이 교시 번호
        const period = cells[0];

        if (!period || isNaN(Number(period))) {
          continue; // 교시 번호가 아니면 스킵
        }

        // 나머지 셀들이 각 요일의 과목
        for (let j = 0; j < dayHeaders.length && j + 1 < cells.length; j++) {
          const day = dayHeaders[j];
          const subject = cells[j + 1] || ''; // +1은 첫 번째 셀이 교시 번호이므로

          if (subject && day) {
            parsed[`${day}-${period}`] = subject;
          }
        }
      }

      console.log('파싱 결과:', parsed);

      if (Object.keys(parsed).length === 0) {
        alert('파싱된 데이터가 없습니다. 형식을 확인해주세요.');
        return;
      }

      setPreviewData(parsed);
    } catch (err) {
      console.error('파싱 실패:', err);
      alert('형식이 올바르지 않습니다. 표를 복사해서 붙여넣어주세요.');
    }
  };

  // 시간표 저장
  const handleSave = async () => {
    if (!previewData) {
      alert('먼저 시간표를 파싱해주세요.');
      return;
    }

    try {
      await setDoc(doc(db, 'timetable', 'current'), {
        schedule: previewData,
        updatedAt: Timestamp.now()
      });

      alert('시간표가 저장되었습니다!');
      setTimetable(previewData);
      setPasteText('');
      setPreviewData(null);
    } catch (err) {
      console.error('저장 실패:', err);
      alert('시간표 저장에 실패했습니다.');
    }
  };

  // 직접 수정
  const handleDirectEdit = (day: string, period: number, value: string) => {
    setTimetable(prev => ({
      ...prev,
      [`${day}-${period}`]: value
    }));
  };

  // 직접 수정 내용 저장
  const handleSaveDirectEdit = async () => {
    try {
      await setDoc(doc(db, 'timetable', 'current'), {
        schedule: timetable,
        updatedAt: Timestamp.now()
      });

      alert('시간표가 저장되었습니다!');
    } catch (err) {
      console.error('저장 실패:', err);
      alert('시간표 저장에 실패했습니다.');
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
          <h1 className="text-2xl font-bold">📚 시간표 관리</h1>
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
        {/* 복사-붙여넣기 입력 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📋 표 복사-붙여넣기</h2>
          <p className="text-sm text-gray-600 mb-4">
            엑셀이나 워드에서 시간표를 복사한 후 아래에 붙여넣으세요.
            <br />
            형식: 첫 줄은 요일(월, 화, 수, 목, 금), 나머지는 각 교시별 과목
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="여기에 표를 붙여넣으세요..."
            className="w-full h-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleParsePaste}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              미리보기
            </button>
            {previewData && (
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                저장하기
              </button>
            )}
          </div>
        </div>

        {/* 미리보기 또는 현재 시간표 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {previewData ? '📄 미리보기' : '📚 현재 시간표'}
            </h2>
            {!previewData && Object.keys(timetable).length > 0 && (
              <button
                onClick={handleSaveDirectEdit}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                변경사항 저장
              </button>
            )}
          </div>

          {Object.keys(previewData || timetable).length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              시간표가 없습니다. 위에서 표를 붙여넣어 등록해주세요.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                      교시
                    </th>
                    {days.map(day => (
                      <th key={day} className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-center font-bold bg-gray-50">
                        {period}
                      </td>
                      {days.map(day => {
                        const key = `${day}-${period}`;
                        const value = (previewData || timetable)[key] || '';

                        return (
                          <td key={key} className="border border-gray-300 px-4 py-3 text-center">
                            {previewData ? (
                              <span className="text-gray-800">{value}</span>
                            ) : (
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => handleDirectEdit(day, period, e.target.value)}
                                className="w-full px-2 py-1 text-center border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                placeholder="-"
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
