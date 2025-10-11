'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Student, Attendance, EmotionType } from '@/lib/types';

export default function KioskAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10초마다 새로고침
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // 학생 목록
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Student[];

      // 오늘 출석 데이터
      const today = new Date().toISOString().split('T')[0];
      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      const attendanceData = attendanceSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            studentId: data.studentId,
            studentName: data.studentName,
            date: data.date,
            time: data.time?.toDate(),
            emotion: data.emotion,
            photoUrl: data.photoUrl,
            showPhoto: data.showPhoto,
            createdAt: data.createdAt?.toDate(),
          } as Attendance;
        })
        .filter(att => att.date === today);

      setStudents(studentsData);
      setAttendanceData(attendanceData);
      setLoading(false);
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      setLoading(false);
    }
  };

  const emotionEmojis: Record<EmotionType, string> = {
    happy: '😊',
    excited: '🤩',
    tired: '😫',
    bored: '😑',
    angry: '😠',
    sad: '😢',
    worried: '😰',
    sleepy: '😴',
    curious: '🤔',
  };

  const emotionLabels: Record<EmotionType, string> = {
    happy: '행복해요',
    excited: '신나요',
    tired: '피곤해요',
    bored: '지루해요',
    angry: '화나요',
    sad: '슬퍼요',
    worried: '걱정돼요',
    sleepy: '졸려요',
    curious: '궁금해요',
  };

  // 통계 계산
  const attendanceRate = students.length > 0
    ? Math.round((attendanceData.length / students.length) * 100)
    : 0;

  // 감정 분포
  const emotionCounts: Record<EmotionType, number> = {
    happy: 0,
    excited: 0,
    tired: 0,
    bored: 0,
    angry: 0,
    sad: 0,
    worried: 0,
    sleepy: 0,
    curious: 0,
  };

  attendanceData.forEach(att => {
    emotionCounts[att.emotion]++;
  });

  // 이름 이니셜 배경색 생성 (학생마다 고정)
  const getInitialColor = (name: string) => {
    const colors = [
      'bg-red-200',
      'bg-orange-200',
      'bg-yellow-200',
      'bg-green-200',
      'bg-teal-200',
      'bg-blue-200',
      'bg-indigo-200',
      'bg-purple-200',
      'bg-pink-200',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
        <div className="text-white text-3xl font-bold">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-8">
      {/* 헤더 */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">📊 오늘의 출석 현황</h1>
          <Link
            href="/kiosk"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition text-lg font-semibold"
          >
            키오스크 홈
          </Link>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-2">출석률</p>
            <p className="text-4xl font-bold text-blue-600">{attendanceRate}%</p>
            <p className="text-sm text-gray-500 mt-2">
              {attendanceData.length} / {students.length}명
            </p>
          </div>

          <div className="bg-green-50 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-2">출석 완료</p>
            <p className="text-4xl font-bold text-green-600">{attendanceData.length}명</p>
          </div>

          <div className="bg-red-50 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-2">미출석</p>
            <p className="text-4xl font-bold text-red-600">{students.length - attendanceData.length}명</p>
          </div>
        </div>

        {/* 감정 분포 */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">오늘의 기분</h2>
          <div className="grid grid-cols-9 gap-3">
            {(Object.keys(emotionEmojis) as EmotionType[]).map(emotion => (
              <div
                key={emotion}
                className={`p-4 rounded-xl text-center ${
                  emotionCounts[emotion] > 0 ? 'bg-purple-50' : 'bg-gray-50'
                }`}
              >
                <div className="text-3xl mb-2">{emotionEmojis[emotion]}</div>
                <p className="text-xs text-gray-600 mb-1">{emotionLabels[emotion]}</p>
                <p className="text-lg font-bold text-purple-600">{emotionCounts[emotion]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 전체 학생 카드 */}
      <div className="grid grid-cols-4 gap-6">
        {students.length === 0 ? (
          <div className="col-span-4 bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-xl">등록된 학생이 없습니다.</p>
          </div>
        ) : (
          students
            .sort((a, b) => {
              // 학년 -> 반 -> 번호 순으로 정렬
              if (a.grade !== b.grade) return a.grade - b.grade;
              if (a.class !== b.class) return a.class - b.class;
              return a.number - b.number;
            })
            .map(student => {
              const attendance = attendanceData.find(a => a.studentId === student.id);
              const isPresent = !!attendance;

              return (
                <div
                  key={student.id}
                  className={`rounded-2xl shadow-lg p-6 transition ${
                    isPresent
                      ? 'bg-white hover:shadow-xl'
                      : 'bg-gray-100 opacity-60'
                  }`}
                >
                  {/* 학생 사진 또는 이니셜 */}
                  <div className="mb-4">
                    {isPresent ? (
                      // 출석한 학생
                      attendance.showPhoto ? (
                        <img
                          src={attendance.photoUrl}
                          alt={student.name}
                          className="w-full aspect-square object-cover rounded-xl"
                        />
                      ) : (
                        <div
                          className={`w-full aspect-square ${getInitialColor(student.name)} rounded-xl flex items-center justify-center`}
                        >
                          <span className="text-6xl font-bold text-gray-700">
                            {student.name[0]}
                          </span>
                        </div>
                      )
                    ) : (
                      // 출석 안 한 학생
                      <div className="w-full aspect-square bg-gray-300 rounded-xl flex items-center justify-center">
                        <span className="text-6xl font-bold text-gray-500">
                          {student.name[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 학생 정보 */}
                  <div className="text-center mb-3">
                    <h3 className={`text-xl font-bold ${isPresent ? 'text-gray-800' : 'text-gray-500'}`}>
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {student.grade}학년 {student.class}반 {student.number}번
                    </p>
                  </div>

                  {/* 감정 또는 미출석 */}
                  {isPresent ? (
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <div className="text-3xl mb-1">{emotionEmojis[attendance.emotion]}</div>
                      <p className="text-sm font-semibold text-purple-700">
                        {emotionLabels[attendance.emotion]}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-200 rounded-xl p-3 text-center">
                      <div className="text-3xl mb-1">❌</div>
                      <p className="text-sm font-semibold text-gray-600">미출석</p>
                    </div>
                  )}

                  {/* 출석 시간 */}
                  {isPresent && (
                    <p className="text-xs text-gray-400 text-center mt-3">
                      {attendance.time.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
