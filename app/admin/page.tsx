'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import StudentStats from '@/components/dashboard/StudentStats';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import AssignmentSubmissionStatus from '@/components/dashboard/AssignmentSubmissionStatus';
import type { Student, PointHistory } from '@/lib/types';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({ present: 0, absent: 0, total: 0 });
  const [statsData, setStatsData] = useState<{ label: string; value: number; max: number; color: string }[]>([]);
  const [activities, setActivities] = useState<{ id: string; type: 'assignment' | 'goal' | 'praise' | 'point' | 'coupon'; title: string; description: string; timestamp: Date; icon: string; color: string }[]>([]);

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

      // 2. 오늘 출석 현황 - 서울 시간 기준 (YYYY-MM-DD 형식)
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

        // type을 명시적으로 지정
        let type: 'assignment' | 'goal' | 'praise' | 'point' | 'coupon';
        if (data.source === 'assignment') {
          type = 'assignment';
        } else if (data.source === 'praise_received' || data.source === 'praise_given') {
          type = 'praise';
        } else if (data.source === 'goal') {
          type = 'goal';
        } else if (data.source === 'shop') {
          type = 'coupon'; // shop은 coupon으로 표시
        } else {
          type = 'point';
        }

        return {
          id: doc.id,
          type,
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

      {/* Main Content Grid - 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1, Column 1: Attendance */}
        <div>
          <AttendanceChart
            present={attendanceData.present}
            absent={attendanceData.absent}
            total={attendanceData.total}
          />
        </div>

        {/* Row 1, Column 2: Assignment Submission */}
        <div>
          <AssignmentSubmissionStatus />
        </div>

        {/* Row 2, Column 1: Student Stats */}
        <div>
          <StudentStats stats={statsData} />
        </div>

        {/* Row 2, Column 2: Activity Feed */}
        <div>
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

      {/* Praise Management */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">칭찬 관리</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <a
            href="/admin/teacher-praise"
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md p-6 hover:shadow-lg transition text-center border-2 border-purple-200"
          >
            <div className="text-4xl mb-2">💐</div>
            <p className="font-semibold text-gray-800">선생님 칭찬 확인</p>
            <p className="text-xs text-gray-600 mt-1">학생들이 보낸 칭찬</p>
          </a>
          <a
            href="/admin/praise-list"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-4xl mb-2">📋</div>
            <p className="font-semibold text-gray-800">전체 칭찬 관리</p>
            <p className="text-xs text-gray-600 mt-1">모든 칭찬 내역</p>
          </a>
          <a
            href="/admin/praise"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-center"
          >
            <div className="text-4xl mb-2">✨</div>
            <p className="font-semibold text-gray-800">칭찬하기</p>
            <p className="text-xs text-gray-600 mt-1">학생 칭찬 작성</p>
          </a>
        </div>
      </div>
    </div>
  );
}
