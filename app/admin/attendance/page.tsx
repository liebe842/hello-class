'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Attendance, Student } from '@/lib/types';

export default function AttendanceDashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 학생 목록
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const studentsData = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Student[];
        setStudents(studentsData);

        // 오늘 출석 데이터 - 서울 시간 기준 (YYYY-MM-DD 형식)
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('date', '==', today)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceData = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().time?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as Attendance[];
        setTodayAttendance(attendanceData);

        setLoading(false);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
        setLoading(false);
      }
    };

    fetchData();
    // 10초마다 자동 새로고침
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // 출석률 계산
  const attendanceRate = students.length > 0
    ? Math.round((todayAttendance.length / students.length) * 100)
    : 0;

  // 감정 분포 계산
  const emotionCounts: Record<string, number> = {};
  todayAttendance.forEach(att => {
    emotionCounts[att.emotion] = (emotionCounts[att.emotion] || 0) + 1;
  });

  const emotionLabels: Record<string, string> = {
    happy: '😊 행복해요',
    excited: '😆 신나요',
    tired: '😴 피곤해요',
    bored: '😑 지루해요',
    angry: '😠 화나요',
    sad: '😢 슬퍼요',
    worried: '😰 걱정돼요',
    sleepy: '😪 졸려요',
    curious: '🤔 궁금해요',
  };

  // 미출석 학생
  const attendedStudentIds = new Set(todayAttendance.map(att => att.studentId));
  const absentStudents = students.filter(s => !attendedStudentIds.has(s.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-green-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">출석 현황 대시보드</h1>
          <Link
            href="/admin"
            className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            관리자 홈
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 상단 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm text-gray-600 mb-2">전체 학생</h3>
            <p className="text-4xl font-bold text-blue-600">{students.length}명</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm text-gray-600 mb-2">출석 완료</h3>
            <p className="text-4xl font-bold text-green-600">{todayAttendance.length}명</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm text-gray-600 mb-2">미출석</h3>
            <p className="text-4xl font-bold text-red-600">{absentStudents.length}명</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm text-gray-600 mb-2">출석률</h3>
            <p className="text-4xl font-bold text-purple-600">{attendanceRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 감정 분포 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">😊 오늘의 학급 분위기</h2>
            {Object.keys(emotionCounts).length === 0 ? (
              <p className="text-gray-500">아직 출석한 학생이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(emotionCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([emotion, count]) => (
                    <div key={emotion} className="flex items-center justify-between">
                      <span className="text-gray-700">{emotionLabels[emotion]}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full"
                            style={{
                              width: `${(count / todayAttendance.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-bold text-gray-800 w-12 text-right">
                          {count}명
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 미출석 학생 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">⚠️ 미출석 학생</h2>
            {absentStudents.length === 0 ? (
              <p className="text-green-600 font-semibold">
                🎉 전원 출석 완료!
              </p>
            ) : (
              <div className="space-y-2">
                {absentStudents.map(student => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-800">{student.name}</span>
                    <span className="text-sm text-gray-600">{student.grade}학년 {student.class}반 {student.number}번</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 최근 출석 기록 */}
          <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📋 최근 출석 기록</h2>
            {todayAttendance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 출석한 학생이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayAttendance
                  .sort((a, b) => b.time.getTime() - a.time.getTime())
                  .map((att) => (
                    <div
                      key={att.id}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition"
                    >
                      {/* 출석 사진 */}
                      {att.photoUrl ? (
                        <Image
                          src={att.photoUrl}
                          alt={`${att.studentName} 출석 사진`}
                          width={400}
                          height={192}
                          className="w-full h-48 object-cover rounded-lg mb-3"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                          <span className="text-6xl">👤</span>
                        </div>
                      )}

                      {/* 학생 정보 */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-lg text-gray-800">
                            {att.studentName}
                          </h3>
                          <span className="text-2xl">{emotionLabels[att.emotion]}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {att.time.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
