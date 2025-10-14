'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import StudentStats from '@/components/dashboard/StudentStats';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import type { Student, PointHistory } from '@/lib/types';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({ present: 0, absent: 0, total: 0 });
  const [statsData, setStatsData] = useState<{ label: string; value: number; max: number; color: string }[]>([]);
  const [activities, setActivities] = useState<{ id: string; type: string; title: string; description: string; timestamp: Date; icon: string; color: string }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. 학생 목록
      const studentsSnap = await getDocs(collection(db, 'students'));
      const students = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];

      const totalStudents = students.length;

      // 2. 오늘 출석 현황
      const today = new Date().toISOString().split('T')[0];
      const attendanceSnap = await getDocs(collection(db, 'attendance'));
      const todayAttendance = attendanceSnap.docs.filter(
        doc => doc.data().date === today
      );

      setAttendanceData({
        present: todayAttendance.length,
        absent: totalStudents - todayAttendance.length,
        total: totalStudents,
      });

      // 3. 학생 통계 (상위 5명 포인트)
      const sortedByPoints = [...students]
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 5);

      const maxPoints = Math.max(...students.map(s => s.points || 0), 100);

      const stats = sortedByPoints.map((student, index) => ({
        label: student.name,
        value: student.points || 0,
        max: maxPoints,
        color: ['#e74a3b', '#f6c23e', '#4e73df', '#1cc88a', '#858796'][index],
      }));

      setStatsData(stats);

      // 4. 최근 활동 (포인트 내역)
      const pointHistorySnap = await getDocs(
        query(
          collection(db, 'pointHistory'),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
      );

      const recentActivities = pointHistorySnap.docs.map(doc => {
        const data = doc.data() as PointHistory;
        // Firestore Timestamp를 Date로 변환
        let timestamp: Date;
        if (data.createdAt instanceof Date) {
          timestamp = data.createdAt;
        } else if (data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt) {
          timestamp = (data.createdAt as { toDate: () => Date }).toDate();
        } else {
          timestamp = new Date();
        }

        return {
          id: doc.id,
          type: data.source === 'assignment' ? 'assignment' :
                data.source === 'praise_received' || data.source === 'praise_given' ? 'praise' :
                data.source === 'goal' ? 'goal' : 'point',
          title: data.studentName,
          description: data.description,
          timestamp,
          icon: '',
          color: '',
        };
      });

      setActivities(recentActivities);

      setLoading(false);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      setLoading(false);
    }
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">대시보드</h1>
        <p className="text-gray-600">오늘 하루도 화이팅! 오늘의 학급 현황입니다.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">전체 학생</p>
              <p className="text-3xl font-bold">{attendanceData.total}명</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">오늘 출석</p>
              <p className="text-3xl font-bold">{attendanceData.present}명</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-1">오늘 결석</p>
              <p className="text-3xl font-bold">{attendanceData.absent}명</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm mb-1">출석률</p>
              <p className="text-3xl font-bold">
                {attendanceData.total > 0 ? Math.round((attendanceData.present / attendanceData.total) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1">
          <AttendanceChart
            present={attendanceData.present}
            absent={attendanceData.absent}
            total={attendanceData.total}
          />
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-1">
          <StudentStats stats={statsData} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/assignments"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-4xl mb-2">📝</div>
            <p className="font-semibold text-gray-800">과제 등록</p>
          </a>
          <a
            href="/admin/points/grant"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-4xl mb-2">💰</div>
            <p className="font-semibold text-gray-800">포인트 지급</p>
          </a>
          <a
            href="/admin/coupons"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-4xl mb-2">🎫</div>
            <p className="font-semibold text-gray-800">쿠폰 승인</p>
          </a>
          <a
            href="/admin/minigames"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-4xl mb-2">🎮</div>
            <p className="font-semibold text-gray-800">게임 등록</p>
          </a>
        </div>
      </div>
    </div>
  );
}
