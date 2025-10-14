import type { BadgeType, BadgeInfo } from './types';

// 모든 배지 정보 (희귀도 순: 일반 > 레어 > 에픽 > 전설)
export const BADGES: Record<BadgeType, BadgeInfo> = {
  // === 일반 (Common) ===
  first_quiz: {
    type: 'first_quiz',
    name: '첫 퀴즈',
    description: '첫 퀴즈를 만들었어요!',
    emoji: '🎯',
    color: 'bg-blue-500',
    rarity: 'common',
  },
  quiz_master_5: {
    type: 'quiz_master_5',
    name: '퀴즈 제작자',
    description: '퀴즈 5개를 만들었어요!',
    emoji: '✏️',
    color: 'bg-green-500',
    rarity: 'common',
  },
  challenge_10: {
    type: 'challenge_10',
    name: '도전자',
    description: '퀴즈 도전 10회를 달성했어요!',
    emoji: '🔥',
    color: 'bg-red-500',
    rarity: 'common',
  },

  // === 레어 (Rare) ===
  quiz_master_10: {
    type: 'quiz_master_10',
    name: '퀴즈 마스터',
    description: '퀴즈 10개를 만들었어요!',
    emoji: '📝',
    color: 'bg-purple-500',
    rarity: 'rare',
  },
  perfect_score: {
    type: 'perfect_score',
    name: '완벽주의자',
    description: '100점 만점을 달성했어요!',
    emoji: '💯',
    color: 'bg-yellow-500',
    rarity: 'rare',
  },
  high_scorer: {
    type: 'high_scorer',
    name: '고득점자',
    description: '90점 이상을 5번 받았어요!',
    emoji: '⭐',
    color: 'bg-orange-500',
    rarity: 'rare',
  },
  verified_creator: {
    type: 'verified_creator',
    name: '인정받은 제작자',
    description: '선생님께 검증된 퀴즈를 만들었어요!',
    emoji: '✅',
    color: 'bg-green-600',
    rarity: 'rare',
  },
  helper: {
    type: 'helper',
    name: '협력왕',
    description: '다른 친구 퀴즈 50개를 풀었어요!',
    emoji: '🤝',
    color: 'bg-cyan-500',
    rarity: 'rare',
  },
  happy_virus: {
    type: 'happy_virus',
    name: '행복 바이러스',
    description: '\'행복해요\' 감정 30회 선택',
    emoji: '😊',
    color: 'bg-yellow-500',
    rarity: 'rare',
  },
  positive_king: {
    type: 'positive_king',
    name: '긍정왕',
    description: '\'신나요\' 감정 20회 선택',
    emoji: '🤩',
    color: 'bg-pink-500',
    rarity: 'rare',
  },
  photographer: {
    type: 'photographer',
    name: '사진작가',
    description: '출석 사진 공개 20회',
    emoji: '📸',
    color: 'bg-blue-500',
    rarity: 'rare',
  },
  praiser: {
    type: 'praiser',
    name: '칭찬하는 아이',
    description: '칭찬 10회 작성',
    emoji: '💝',
    color: 'bg-rose-500',
    rarity: 'rare',
  },

  // === 에픽 (Epic) ===
  challenge_50: {
    type: 'challenge_50',
    name: '열정가',
    description: '퀴즈 도전 50회를 달성했어요!',
    emoji: '💪',
    color: 'bg-pink-500',
    rarity: 'epic',
  },
  verified_master: {
    type: 'verified_master',
    name: '검증 마스터',
    description: '검증된 퀴즈 5개를 만들었어요!',
    emoji: '🏅',
    color: 'bg-emerald-600',
    rarity: 'epic',
  },
  top_3: {
    type: 'top_3',
    name: '상위권',
    description: '리더보드 3위 이내에 들었어요!',
    emoji: '🏆',
    color: 'bg-orange-600',
    rarity: 'epic',
  },
  subject_master: {
    type: 'subject_master',
    name: '과목 마스터',
    description: '특정 과목에서 평균 90점 이상!',
    emoji: '📚',
    color: 'bg-indigo-600',
    rarity: 'epic',
  },
  problem_solver: {
    type: 'problem_solver',
    name: '문제해결사',
    description: '다른 친구 퀴즈 100개를 풀었어요!',
    emoji: '🎓',
    color: 'bg-blue-600',
    rarity: 'epic',
  },
  goal_achiever: {
    type: 'goal_achiever',
    name: '목표 달성자',
    description: '학생 목표 3개 달성',
    emoji: '🎯',
    color: 'bg-purple-500',
    rarity: 'epic',
  },

  // === 전설 (Legendary) ===
  top_ranker: {
    type: 'top_ranker',
    name: '1등',
    description: '리더보드 1위를 달성했어요!',
    emoji: '🥇',
    color: 'bg-yellow-600',
    rarity: 'legendary',
  },
};

// 희귀도별 색상 및 라벨
export const RARITY_INFO = {
  common: {
    label: '일반',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  rare: {
    label: '레어',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  epic: {
    label: '에픽',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
  },
  legendary: {
    label: '전설',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
};

// 배지 획득 조건 체크 함수들
export interface BadgeCheckData {
  quizzesCreated: number;
  verifiedQuizzes: number;
  attemptScores: number[];
  totalAttempts: number;
  othersQuizzesSolved: number;
  leaderboardRank: number | null;
  subjectAverages: Record<string, number>;
  happyEmotionCount: number;        // '행복해요' 감정 선택 횟수
  excitedEmotionCount: number;      // '신나요' 감정 선택 횟수
  completedGoalsCount: number;      // 완료한 목표 개수
  photoPublicCount: number;         // 사진 공개한 출석 횟수
  praisesGivenCount: number;        // 작성한 칭찬 횟수
}

export function checkBadgeEligibility(
  badgeType: BadgeType,
  data: BadgeCheckData
): boolean {
  switch (badgeType) {
    // 퀴즈 제작
    case 'first_quiz':
      return data.quizzesCreated >= 1;
    case 'quiz_master_5':
      return data.quizzesCreated >= 5;
    case 'quiz_master_10':
      return data.quizzesCreated >= 10;

    // 점수
    case 'perfect_score':
      return data.attemptScores.some(score => score === 100);
    case 'high_scorer':
      return data.attemptScores.filter(score => score >= 90).length >= 5;

    // 도전 횟수
    case 'challenge_10':
      return data.totalAttempts >= 10;
    case 'challenge_50':
      return data.totalAttempts >= 50;

    // 검증
    case 'verified_creator':
      return data.verifiedQuizzes >= 1;
    case 'verified_master':
      return data.verifiedQuizzes >= 5;

    // 순위
    case 'top_ranker':
      return data.leaderboardRank === 1;
    case 'top_3':
      return data.leaderboardRank !== null && data.leaderboardRank <= 3;

    // 과목 마스터
    case 'subject_master':
      return Object.values(data.subjectAverages).some(avg => avg >= 90);

    // 협력
    case 'helper':
      return data.othersQuizzesSolved >= 50;
    case 'problem_solver':
      return data.othersQuizzesSolved >= 100;

    // 감정/출석
    case 'happy_virus':
      return data.happyEmotionCount >= 30;
    case 'positive_king':
      return data.excitedEmotionCount >= 20;

    // 목표
    case 'goal_achiever':
      return data.completedGoalsCount >= 3;

    // 사진 공개
    case 'photographer':
      return data.photoPublicCount >= 20;

    // 칭찬
    case 'praiser':
      return data.praisesGivenCount >= 10;

    default:
      return false;
  }
}

// 모든 획득 가능한 배지 체크
export function checkAllBadges(data: BadgeCheckData): BadgeType[] {
  const eligibleBadges: BadgeType[] = [];

  for (const badgeType of Object.keys(BADGES) as BadgeType[]) {
    if (checkBadgeEligibility(badgeType, data)) {
      eligibleBadges.push(badgeType);
    }
  }

  return eligibleBadges;
}
