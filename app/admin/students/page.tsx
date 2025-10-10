'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import type { Student } from '@/lib/types';

export default function StudentsManagePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    grade: 5,
    class: 3,
    number: 1,
    password: '',
  });

  // 학생 목록 불러오기
  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Student[];

      // 학년 → 반 → 번호 순으로 정렬
      studentsData.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        if (a.class !== b.class) return a.class - b.class;
        return a.number - b.number;
      });

      setStudents(studentsData);
    } catch (error) {
      console.error('학생 목록 불러오기 실패:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 학생 추가
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'students'), {
        ...formData,
        createdAt: new Date(),
      });
      alert('학생이 등록되었습니다!');
      setShowAddModal(false);
      setFormData({ name: '', grade: 5, class: 3, number: 1, password: '' });
      fetchStudents();
    } catch (error) {
      console.error('학생 등록 실패:', error);
      alert('학생 등록에 실패했습니다.');
    }
  };

  // Storage URL에서 경로 추출
  const getStoragePathFromUrl = (url: string): string | null => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const match = decodedUrl.match(/\/o\/(.+?)\?/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // 학생 삭제 (관련 데이터 모두 삭제)
  const handleDeleteStudent = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까? 출석 기록, 과제 제출 기록, 업로드된 파일도 모두 삭제됩니다.')) {
      try {
        // 1. 출석 기록의 사진 파일 삭제
        const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', id));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceFileDeletePromises = attendanceSnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          if (data.photoUrl) {
            const storagePath = getStoragePathFromUrl(data.photoUrl);
            if (storagePath) {
              try {
                await deleteObject(ref(storage, storagePath));
              } catch (error) {
                console.log('파일 삭제 실패 (파일이 없을 수 있음):', storagePath);
              }
            }
          }
        });
        await Promise.all(attendanceFileDeletePromises);

        // 2. 과제 제출 기록의 사진 파일 삭제
        const submissionsQuery = query(collection(db, 'assignmentSubmissions'), where('studentId', '==', id));
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsFileDeletePromises = submissionsSnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          if (data.imageUrl) {
            const storagePath = getStoragePathFromUrl(data.imageUrl);
            if (storagePath) {
              try {
                await deleteObject(ref(storage, storagePath));
              } catch (error) {
                console.log('파일 삭제 실패 (파일이 없을 수 있음):', storagePath);
              }
            }
          }
        });
        await Promise.all(submissionsFileDeletePromises);

        // 3. 출석 기록 Firestore 데이터 삭제
        const attendanceDeletePromises = attendanceSnapshot.docs.map(docSnapshot =>
          deleteDoc(doc(db, 'attendance', docSnapshot.id))
        );
        await Promise.all(attendanceDeletePromises);

        // 4. 과제 제출 기록 Firestore 데이터 삭제
        const submissionsDeletePromises = submissionsSnapshot.docs.map(docSnapshot =>
          deleteDoc(doc(db, 'assignmentSubmissions', docSnapshot.id))
        );
        await Promise.all(submissionsDeletePromises);

        // 5. 학생 데이터 삭제
        await deleteDoc(doc(db, 'students', id));

        alert('학생이 삭제되었습니다.');
        fetchStudents();
      } catch (error) {
        console.error('학생 삭제 실패:', error);
        alert('학생 삭제에 실패했습니다.');
      }
    }
  };

  // 체크박스 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // 개별 체크박스 토글
  const handleSelectStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id)
        ? prev.filter(studentId => studentId !== id)
        : [...prev, id]
    );
  };

  // 선택된 학생 일괄 삭제 (관련 데이터 모두 삭제)
  const handleDeleteSelected = async () => {
    if (selectedStudents.length === 0) {
      alert('삭제할 학생을 선택해주세요.');
      return;
    }

    if (confirm(`정말 선택한 ${selectedStudents.length}명을 삭제하시겠습니까? 출석 기록, 과제 제출 기록, 업로드된 파일도 모두 삭제됩니다.`)) {
      try {
        // 각 학생에 대해 관련 데이터 모두 삭제
        const deletePromises = selectedStudents.map(async (id) => {
          // 1. 출석 기록의 사진 파일 삭제
          const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', id));
          const attendanceSnapshot = await getDocs(attendanceQuery);
          const attendanceFileDeletePromises = attendanceSnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            if (data.photoUrl) {
              const storagePath = getStoragePathFromUrl(data.photoUrl);
              if (storagePath) {
                try {
                  await deleteObject(ref(storage, storagePath));
                } catch (error) {
                  console.log('파일 삭제 실패 (파일이 없을 수 있음):', storagePath);
                }
              }
            }
          });
          await Promise.all(attendanceFileDeletePromises);

          // 2. 과제 제출 기록의 사진 파일 삭제
          const submissionsQuery = query(collection(db, 'assignmentSubmissions'), where('studentId', '==', id));
          const submissionsSnapshot = await getDocs(submissionsQuery);
          const submissionsFileDeletePromises = submissionsSnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            if (data.imageUrl) {
              const storagePath = getStoragePathFromUrl(data.imageUrl);
              if (storagePath) {
                try {
                  await deleteObject(ref(storage, storagePath));
                } catch (error) {
                  console.log('파일 삭제 실패 (파일이 없을 수 있음):', storagePath);
                }
              }
            }
          });
          await Promise.all(submissionsFileDeletePromises);

          // 3. 출석 기록 Firestore 데이터 삭제
          const attendanceDeletePromises = attendanceSnapshot.docs.map(docSnapshot =>
            deleteDoc(doc(db, 'attendance', docSnapshot.id))
          );
          await Promise.all(attendanceDeletePromises);

          // 4. 과제 제출 기록 Firestore 데이터 삭제
          const submissionsDeletePromises = submissionsSnapshot.docs.map(docSnapshot =>
            deleteDoc(doc(db, 'assignmentSubmissions', docSnapshot.id))
          );
          await Promise.all(submissionsDeletePromises);

          // 5. 학생 데이터 삭제
          await deleteDoc(doc(db, 'students', id));
        });

        await Promise.all(deletePromises);
        alert(`${selectedStudents.length}명의 학생이 삭제되었습니다.`);
        setSelectedStudents([]);
        fetchStudents();
      } catch (error) {
        console.error('일괄 삭제 실패:', error);
        alert('학생 삭제에 실패했습니다.');
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
        const [name, grade, classNum, number, password] = line.split(',').map(s => s.trim());
        return {
          name,
          grade: parseInt(grade),
          class: parseInt(classNum),
          number: parseInt(number),
          password,
        };
      }).filter(data => data.name && data.grade && data.class && data.number && data.password);

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
        addDoc(collection(db, 'students'), {
          ...data,
          createdAt: new Date(),
        })
      );
      await Promise.all(promises);
      alert(`${csvData.length}명의 학생이 등록되었습니다!`);
      setShowBulkUploadModal(false);
      setCsvData([]);
      fetchStudents();
    } catch (error) {
      console.error('일괄 등록 실패:', error);
      alert('일괄 등록에 실패했습니다.');
    }
  };

  // CSV 템플릿 다운로드
  const downloadTemplate = () => {
    const template = 'name,grade,class,number,password';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '학생_일괄등록_템플릿.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">학생 관리</h1>
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
        {/* 상단 액션 바 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              전체 학생 ({students.length}명)
            </h2>
            {selectedStudents.length > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {selectedStudents.length}명 선택됨
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {selectedStudents.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                🗑️ 선택 삭제 ({selectedStudents.length})
              </button>
            )}
            <button
              onClick={downloadTemplate}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              📥 CSV 템플릿 다운로드
            </button>
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              📄 CSV 일괄 등록
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              + 학생 등록
            </button>
          </div>
        </div>

        {/* 학생 목록 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={students.length > 0 && selectedStudents.length === students.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">이름</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">학년/반/번호</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">비밀번호</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">등록일</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">액션</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    등록된 학생이 없습니다. 학생을 등록해주세요.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{student.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {student.grade}학년 {student.class}반 {student.number}번
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{student.password}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {student.createdAt?.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* CSV 일괄 등록 모달 */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">CSV 일괄 등록</h3>

            {/* CSV 파일 업로드 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CSV 파일 선택
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                형식: name, grade, class, number, password
              </p>
            </div>

            {/* 미리보기 */}
            {csvData.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">
                  미리보기 ({csvData.length}명)
                </h4>
                <div className="border border-gray-300 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">이름</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">학년</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">반</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">번호</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">비밀번호</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((data, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-800">{data.name}</td>
                          <td className="px-4 py-2 text-gray-600">{data.grade}</td>
                          <td className="px-4 py-2 text-gray-600">{data.class}</td>
                          <td className="px-4 py-2 text-gray-600">{data.number}</td>
                          <td className="px-4 py-2 text-gray-600 font-mono">{data.password}</td>
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
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {csvData.length}명 등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 학생 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">학생 등록</h3>
            <form onSubmit={handleAddStudent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    이름 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    placeholder="홍길동"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      학년 *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="6"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      반 *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="20"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      번호 *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="50"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    비밀번호 (4자리) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    placeholder="예: 1234"
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
