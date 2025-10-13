'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import type { SchoolSchedule } from '@/lib/types';

export default function AdminSchoolSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<SchoolSchedule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [csvData, setCsvData] = useState<{startDate: string, endDate?: string, eventName: string}[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    eventName: '',
  });

  // 수정 모드
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editEventName, setEditEventName] = useState('');

  useEffect(() => {
    fetchSchedules().then(() => setLoading(false));
  }, []);

  const fetchSchedules = async () => {
    try {
      const snap = await getDocs(collection(db, 'schoolSchedules'));
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as SchoolSchedule[];

      // 날짜순 정렬
      data.sort((a, b) => a.startDate.localeCompare(b.startDate));
      setSchedules(data);
    } catch (err) {
      console.error('일정 불러오기 실패:', err);
    }
  };

  // 일정 추가
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.eventName) return;

    try {
      await addDoc(collection(db, 'schoolSchedules'), {
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        eventName: formData.eventName,
        createdAt: Timestamp.now()
      });

      alert('일정이 추가되었습니다!');
      setShowAddModal(false);
      setFormData({ startDate: '', endDate: '', eventName: '' });
      fetchSchedules();
    } catch (err) {
      console.error('일정 추가 실패:', err);
      alert('일정 추가에 실패했습니다.');
    }
  };

  // 일정 삭제
  const handleDeleteSchedule = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'schoolSchedules', id));
        alert('일정이 삭제되었습니다.');
        fetchSchedules();
      } catch (err) {
        console.error('일정 삭제 실패:', err);
        alert('일정 삭제에 실패했습니다.');
      }
    }
  };

  // 체크박스 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSchedules(schedules.map(s => s.id));
    } else {
      setSelectedSchedules([]);
    }
  };

  // 개별 체크박스 토글
  const handleSelectSchedule = (id: string) => {
    setSelectedSchedules(prev =>
      prev.includes(id)
        ? prev.filter(scheduleId => scheduleId !== id)
        : [...prev, id]
    );
  };

  // 선택된 일정 일괄 삭제
  const handleDeleteSelected = async () => {
    if (selectedSchedules.length === 0) {
      alert('삭제할 일정을 선택해주세요.');
      return;
    }

    if (confirm(`정말 선택한 ${selectedSchedules.length}개 일정을 삭제하시겠습니까?`)) {
      try {
        const deletePromises = selectedSchedules.map(id =>
          deleteDoc(doc(db, 'schoolSchedules', id))
        );
        await Promise.all(deletePromises);
        alert(`${selectedSchedules.length}개의 일정이 삭제되었습니다.`);
        setSelectedSchedules([]);
        fetchSchedules();
      } catch (err) {
        console.error('일괄 삭제 실패:', err);
        alert('일정 삭제에 실패했습니다.');
      }
    }
  };

  // CSV 파일 읽기
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      // 첫 줄은 헤더이므로 제외
      const dataLines = lines.slice(1);

      const parsedData = dataLines.map(line => {
        const [startDate, endDate, eventName] = line.split(',').map(s => s.trim());
        return { startDate, endDate: endDate || undefined, eventName };
      }).filter(data => data.startDate && data.eventName);

      setCsvData(parsedData);
    };
    reader.readAsText(file);
  };

  // CSV 일괄 등록
  const handleBulkUpload = async () => {
    if (csvData.length === 0) {
      alert('업로드할 데이터가 없습니다.');
      return;
    }

    try {
      const promises = csvData.map(data =>
        addDoc(collection(db, 'schoolSchedules'), {
          startDate: data.startDate,
          endDate: data.endDate || null,
          eventName: data.eventName,
          createdAt: Timestamp.now(),
        })
      );
      await Promise.all(promises);
      alert(`${csvData.length}개의 일정이 등록되었습니다!`);
      setShowBulkUploadModal(false);
      setCsvData([]);
      fetchSchedules();
    } catch (err) {
      console.error('일괄 등록 실패:', err);
      alert('일괄 등록에 실패했습니다.');
    }
  };

  // CSV 템플릿 다운로드
  const downloadTemplate = () => {
    const template = 'startDate,endDate,eventName';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '학사일정_일괄등록_템플릿.csv';
    link.click();
  };

  // 수정 시작
  const startEdit = (schedule: SchoolSchedule) => {
    setEditingId(schedule.id);
    setEditStartDate(schedule.startDate);
    setEditEndDate(schedule.endDate || '');
    setEditEventName(schedule.eventName);
  };

  // 수정 저장
  const handleUpdate = async (id: string) => {
    if (!editStartDate || !editEventName) return;

    try {
      await updateDoc(doc(db, 'schoolSchedules', id), {
        startDate: editStartDate,
        endDate: editEndDate || null,
        eventName: editEventName
      });

      setEditingId(null);
      alert('수정되었습니다!');
      fetchSchedules();
    } catch (err) {
      console.error('수정 실패:', err);
      alert('수정에 실패했습니다.');
    }
  };

  // 날짜 표시 포맷
  const formatDateRange = (startDate: string, endDate?: string) => {
    if (endDate) {
      return `${startDate} ~ ${endDate}`;
    }
    return startDate;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">학사일정 관리</h1>
        <p className="text-gray-600">학교 행사, 방학, 시험 기간 등의 학사일정을 관리합니다.</p>
      </div>

      {/* 상단 액션 바 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            전체 일정 ({schedules.length}개)
          </h2>
            {selectedSchedules.length > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {selectedSchedules.length}개 선택됨
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {selectedSchedules.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                선택 삭제 ({selectedSchedules.length})
              </button>
            )}
            <button
              onClick={downloadTemplate}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              CSV 템플릿 다운로드
            </button>
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              CSV 일괄 등록
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              일정 등록
            </button>
          </div>
        </div>

        {/* 일정 목록 테이블 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={schedules.length > 0 && selectedSchedules.length === schedules.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">날짜</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">행사명</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">등록일</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">액션</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    등록된 학사일정이 없습니다. 일정을 등록해주세요.
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSchedules.includes(schedule.id)}
                        onChange={() => handleSelectSchedule(schedule.id)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </td>
                    {editingId === schedule.id ? (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              className="px-3 py-2 border rounded"
                              placeholder="시작일"
                            />
                            <span className="self-center">~</span>
                            <input
                              type="date"
                              value={editEndDate}
                              onChange={(e) => setEditEndDate(e.target.value)}
                              className="px-3 py-2 border rounded"
                              placeholder="종료일 (선택)"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editEventName}
                            onChange={(e) => setEditEventName(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {schedule.createdAt?.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(schedule.id)}
                              className="text-blue-500 hover:text-blue-700 font-medium"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-500 hover:text-gray-700 font-medium"
                            >
                              취소
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-gray-800 font-mono">
                          {formatDateRange(schedule.startDate, schedule.endDate)}
                        </td>
                        <td className="px-6 py-4 text-gray-800 font-medium">{schedule.eventName}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {schedule.createdAt?.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(schedule)}
                              className="text-blue-500 hover:text-blue-700 font-medium"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="text-red-500 hover:text-red-700 font-medium"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      {/* CSV 일괄 등록 모달 */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-800">CSV 일괄 등록</h3>

            {/* CSV 파일 업로드 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CSV 파일 선택
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                형식: startDate, endDate, eventName
              </p>
              <p className="text-sm text-gray-500">
                단일 날짜: 2025-03-02, , 개학식
              </p>
              <p className="text-sm text-gray-500">
                기간: 2025-05-15, 2025-05-19, 중간고사
              </p>
            </div>

            {/* 미리보기 */}
            {csvData.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">
                  미리보기 ({csvData.length}개)
                </h4>
                <div className="border border-gray-300 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">날짜</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">행사명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((data, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-800 font-mono">
                            {formatDateRange(data.startDate, data.endDate)}
                          </td>
                          <td className="px-4 py-2 text-gray-800">{data.eventName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setCsvData([]);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
              >
                취소
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={csvData.length === 0}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {csvData.length}개 등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-6 text-gray-800">일정 등록</h3>
            <form onSubmit={handleAddSchedule}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    시작일 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    종료일 (선택사항)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">기간이 있는 경우에만 입력</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    행사명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    placeholder="예: 개학식"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
