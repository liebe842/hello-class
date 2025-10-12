'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import type { StudentBadge, BadgeType, QuizAttempt, Quiz, Attendance } from '@/lib/types';
import { BADGES, RARITY_INFO, checkAllBadges, type BadgeCheckData } from '@/lib/badges';

export default function StudentBadgesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentBadges, setStudentBadges] = useState<StudentBadge[]>([]);
  const [newBadges, setNewBadges] = useState<BadgeType[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  // 학생 정보
  const studentData = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('studentSession') || '{}')
    : {};

  useEffect(() => {
    if (!studentData.id) {
      alert('로그인이 필요합니다.');
      router.push('/student/login');
      return;
    }
    fetchAndCheckBadges();
  }, []);

  const fetchAndCheckBadges = async () => {
    try {
      // 기존 배지 가져오기
      const badgesQ = query(
        collection(db, 'studentBadges'),
        where('studentId', '==', studentData.id)
      );
      const badgesSnapshot = await getDocs(badgesQ);
      const existingBadges = badgesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        unlockedAt: doc.data().unlockedAt?.toDate(),
      })) as StudentBadge[];

      // 데이터 수집
      const [attemptsSnap, quizzesSnap, attendanceSnap, allAttemptsSnap] = await Promise.all([
        getDocs(query(collection(db, 'quizAttempts'), where('studentId', '==', studentData.id))),
        getDocs(query(collection(db, 'quizzes'), where('createdBy', '==', studentData.id))),
        getDocs(query(collection(db, 'attendance'), where('studentId', '==', studentData.id))),
        getDocs(collection(db, 'quizAttempts')), // 전체 (순위 계산용)
      ]);

      const attempts = attemptsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as QuizAttempt[];

      const quizzes = quizzesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Quiz[];

      const attendance = attendanceSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().time?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Attendance[];

      // 다른 학생 퀴즈 풀이 수
      const allQuizzesSnap = await getDocs(collection(db, 'quizzes'));
      const allQuizzes = allQuizzesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Quiz[];
      const othersQuizIds = allQuizzes.filter(q => q.createdBy !== studentData.id).map(q => q.id);

      const myResultsSnap = await getDocs(
        query(collection(db, 'quizResults'), where('studentId', '==', studentData.id))
      );
      const othersQuizzesSolved = new Set(
        myResultsSnap.docs
          .map(doc => doc.data().quizId)
          .filter(quizId => othersQuizIds.includes(quizId))
      ).size;

      // 출석 연속 일수 계산
      const sortedAttendance = [...attendance].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      let streak = 0;
      for (let i = 0; i < sortedAttendance.length; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];

        if (sortedAttendance[i]?.date === expectedDateStr) {
          streak++;
        } else {
          break;
        }
      }

      // 오전 8시 이전 출석 확인
      const hasEarlyAttendance = attendance.some(a => {
        const hour = a.time.getHours();
        return hour < 8;
      });

      // 순위 계산 (평균 점수 기준)
      const allAttempts = allAttemptsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as QuizAttempt[];

      const studentScores = new Map<string, number[]>();
      allAttempts.forEach(attempt => {
        const scores = studentScores.get(attempt.studentId) || [];
        scores.push(attempt.score);
        studentScores.set(attempt.studentId, scores);
      });

      const rankings = Array.from(studentScores.entries())
        .map(([studentId, scores]) => ({
          studentId,
          avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        }))
        .sort((a, b) => b.avgScore - a.avgScore);

      const myRank = rankings.findIndex(r => r.studentId === studentData.id) + 1;

      // 과목별 평균
      const subjectScores = new Map<string, number[]>();
      const topicsSnap = await getDocs(collection(db, 'quizTopics'));
      const topics = topicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      attempts.forEach(attempt => {
        const topic = topics.find(t => t.id === attempt.topicId);
        if (topic) {
          const scores = subjectScores.get(topic.subject) || [];
          scores.push(attempt.score);
          subjectScores.set(topic.subject, scores);
        }
      });

      const subjectAverages: Record<string, number> = {};
      subjectScores.forEach((scores, subject) => {
        subjectAverages[subject] = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      });

      // 배지 데이터 준비
      const badgeData: BadgeCheckData = {
        quizzesCreated: quizzes.length,
        verifiedQuizzes: quizzes.filter(q => q.isVerified).length,
        attemptScores: attempts.map(a => a.score),
        totalAttempts: attempts.length,
        othersQuizzesSolved,
        attendanceStreak: streak,
        hasEarlyAttendance,
        leaderboardRank: myRank > 0 ? myRank : null,
        subjectAverages,
      };

      // 획득 가능한 배지 체크
      const eligibleBadgeTypes = checkAllBadges(badgeData);
      const existingBadgeTypes = new Set(existingBadges.map(b => b.badgeType));
      const newBadgeTypes = eligibleBadgeTypes.filter(type => !existingBadgeTypes.has(type));

      // 새 배지 저장
      for (const badgeType of newBadgeTypes) {
        const newBadge = {
          studentId: studentData.id,
          badgeType,
          unlockedAt: new Date(),
          isNew: true,
        };
        const docRef = await addDoc(collection(db, 'studentBadges'), newBadge);
        existingBadges.push({
          id: docRef.id,
          ...newBadge,
        });
      }

      setStudentBadges(existingBadges);
      setNewBadges(newBadgeTypes);
      setLoading(false);
    } catch (err) {
      console.error('배지 불러오기 실패:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  const unlockedBadgeTypes = new Set(studentBadges.map(b => b.badgeType));
  const allBadgeTypes = Object.keys(BADGES) as BadgeType[];

  // 필터링
  const filteredBadges = allBadgeTypes.filter(type => {
    if (selectedRarity === 'all') return true;
    return BADGES[type].rarity === selectedRarity;
  });

  const unlockedCount = studentBadges.length;
  const totalCount = allBadgeTypes.length;
  const progress = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🏅 내 배지 컬렉션</h1>
            <p className="text-yellow-100 text-sm mt-1">
              {unlockedCount} / {totalCount} 배지 획득 ({progress}%)
            </p>
          </div>
          <Link
            href="/student/dashboard"
            className="bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            대시보드
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        {/* 새 배지 알림 */}
        {newBadges.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl shadow-lg p-6 mb-6 animate-pulse">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-2">새 배지 획득!</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {newBadges.map(badgeType => (
                  <div key={badgeType} className="bg-white rounded-lg p-3 shadow-md">
                    <div className="text-3xl mb-1">{BADGES[badgeType].emoji}</div>
                    <div className="text-sm font-bold text-gray-800">{BADGES[badgeType].name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 진행률 바 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">전체 진행률</span>
            <span className="font-bold text-orange-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {unlockedCount}개 획득 · {totalCount - unlockedCount}개 남음
          </div>
        </div>

        {/* 희귀도 필터 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedRarity('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedRarity === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              전체
            </button>
            {Object.entries(RARITY_INFO).map(([rarity, info]) => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(rarity)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedRarity === rarity
                    ? `${info.bgColor} ${info.color}`
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        {/* 배지 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBadges.map(badgeType => {
            const badge = BADGES[badgeType];
            const isUnlocked = unlockedBadgeTypes.has(badgeType);
            const rarityInfo = RARITY_INFO[badge.rarity];

            return (
              <div
                key={badgeType}
                className={`rounded-xl p-6 shadow-md transition transform hover:scale-105 ${
                  isUnlocked
                    ? `${badge.color} text-white`
                    : 'bg-gray-300 text-gray-500 opacity-60'
                }`}
              >
                <div className="text-center">
                  <div className={`text-6xl mb-3 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                    {badge.emoji}
                  </div>
                  <div className="font-bold text-lg mb-1">{badge.name}</div>
                  <div className={`text-sm mb-3 ${isUnlocked ? 'text-white opacity-90' : ''}`}>
                    {badge.description}
                  </div>
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      isUnlocked
                        ? 'bg-white bg-opacity-30'
                        : `${rarityInfo.bgColor} ${rarityInfo.color}`
                    }`}
                  >
                    {rarityInfo.label}
                  </div>
                  {isUnlocked && (
                    <div className="mt-2 text-xs opacity-80">
                      ✓ 획득 완료
                    </div>
                  )}
                  {!isUnlocked && (
                    <div className="mt-2 text-xs">
                      🔒 미획득
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
