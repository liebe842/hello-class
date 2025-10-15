// TypeScript 타입 정의

// 학생 정보
export interface Student {
  id: string;
  name: string;
  grade: number;
  class: number;
  number: number; // 번호 (1, 2, 3...)
  password: string; // 4자리 비밀번호
  photoUrl?: string;
  points: number; // 포인트 잔액
  createdAt: Date;
}

// 출석 기록
export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  time: Date;
  emotion: EmotionType;
  photoUrl: string;
  showPhoto: boolean; // 키오스크에 사진 공개 여부
  createdAt: Date;
}

// 감정 타입
export type EmotionType =
  | 'happy'      // 행복해요
  | 'tired'      // 피곤해요
  | 'excited'    // 신나요
  | 'bored'      // 지루해요
  | 'angry'      // 화나요
  | 'sad'        // 슬퍼요
  | 'worried'    // 걱정돼요
  | 'sleepy'     // 졸려요
  | 'curious';   // 궁금해요

// 과제 제출 타입
export type SubmissionType = 'image' | 'link' | 'note' | 'all' | 'none';

// 과제
export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  submissionType: SubmissionType; // 제출 방식 (이미지/링크/메모/전체/체크만)
  createdAt: Date;
  createdBy: string;
}

// 과제 제출/체크
export interface AssignmentCheck {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  isCompleted: boolean;
  checkedAt: Date;
}

// 퀴즈 타입
export type QuizType = 'multiple-choice' | 'true-false';

// 퀴즈 주제
export interface QuizTopic {
  id: string;
  title: string;                      // 주제 제목
  description: string;                // 주제 설명
  subject: string;                    // 과목
  dueDate: Date;                      // 제출 마감일
  startDate: Date;                    // 시작일
  createdAt: Date;
  createdBy: string;                  // 'teacher'
  isActive: boolean;                  // 활성 상태
  maxQuizzesPerStudent: number;       // 학생당 최대 출제 개수
  allowedQuizTypes: QuizType[];       // 허용하는 퀴즈 타입
}

// 퀴즈
export interface Quiz {
  id: string;
  topicId: string;                    // 어떤 주제인지
  type: QuizType;                     // 퀴즈 타입
  question: string;
  imageUrl?: string;                  // 문제 이미지 (선택)

  // 객관식(4지선다)용
  options?: string[];                 // ['A', 'B', 'C', 'D']
  correctAnswer?: number;             // 정답 인덱스 (0-3)

  // OX 퀴즈용
  correctBoolean?: boolean;           // true | false

  explanation: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  createdBy: string;                  // 'teacher' 또는 학생 ID
  createdByName: string;              // '선생님' 또는 학생 이름

  // 품질 관리
  isVerified: boolean;                // 교사가 확인함
  reportCount: number;                // 신고 횟수
}

// 퀴즈 신고
export interface QuizReport {
  id: string;
  quizId: string;
  reportedBy: string;                 // 신고한 학생 ID
  reportedByName: string;             // 신고한 학생 이름
  reason: string;                     // 신고 사유
  reportedAt: Date;
}

// 퀴즈 댓글
export interface QuizComment {
  id: string;
  quizId: string;
  userId: string;                     // 작성자 ID
  userName: string;                   // 작성자 이름
  userType: 'teacher' | 'student';    // 작성자 유형
  comment: string;                    // 댓글 내용
  createdAt: Date;
}

// 퀴즈 결과 (개별 문제 풀이)
export interface QuizResult {
  id: string;
  quizId: string;
  topicId: string;                    // 주제 ID
  studentId: string;
  studentName: string;
  selectedAnswer: number | boolean;   // 선택한 답 (객관식: 0-3, OX: true/false)
  isCorrect: boolean;
  answeredAt: Date;
  responseTime: number;               // 응답 시간 (초)
  attemptId?: string;                 // 어떤 도전에 속하는지 (선택)
}

// 퀴즈 도전 (전체/랜덤 모드)
export interface QuizAttempt {
  id: string;
  topicId: string;                    // 주제 ID
  studentId: string;
  studentName: string;
  mode: 'full' | 'random';            // 전체 도전 or 랜덤 도전
  totalQuestions: number;             // 총 문제 수
  correctAnswers: number;             // 맞춘 개수
  score: number;                      // 점수 (%)
  completedAt: Date;
  timeSpent: number;                  // 소요 시간 (초)
}

// 학급 설정
export interface ClassConfig {
  id: string;
  grade: number;
  classNumber: number;
  schoolName: string;
  teacherName: string;
  schoolApiKey?: string;
  canvaNewsletterUrl?: string;
  updatedAt: Date;
}

// 공지사항
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'school' | 'class';
  createdAt: Date;
  createdBy: string;
}

// 배지 타입
export type BadgeType =
  | 'first_quiz'           // 첫 퀴즈 제작
  | 'quiz_master_5'        // 퀴즈 5개 제작
  | 'quiz_master_10'       // 퀴즈 10개 제작
  | 'perfect_score'        // 100점 달성
  | 'high_scorer'          // 90점 이상 5회
  | 'challenge_10'         // 도전 10회
  | 'challenge_50'         // 도전 50회
  | 'verified_creator'     // 검증된 퀴즈 1개
  | 'verified_master'      // 검증된 퀴즈 5개
  | 'top_ranker'           // 리더보드 1위
  | 'top_3'                // 리더보드 3위 이내
  | 'subject_master'       // 특정 과목 평균 90점 이상
  | 'helper'               // 다른 학생 퀴즈 50개 풀기
  | 'problem_solver'       // 다른 학생 퀴즈 100개 풀기
  | 'happy_virus'          // 행복 바이러스 - '행복해요' 감정 30회 선택
  | 'positive_king'        // 긍정왕 - '신나요' 감정 20회 선택
  | 'goal_achiever'        // 목표 달성자 - 학생 목표 3개 달성
  | 'photographer'         // 사진작가 - 출석 사진 공개 20회
  | 'praiser';             // 칭찬하는 아이 - 칭찬 10회 작성

// 배지 정보
export interface BadgeInfo {
  type: BadgeType;
  name: string;             // 배지 이름
  description: string;      // 설명
  emoji: string;            // 이모지
  color: string;            // 색상 (Tailwind 클래스)
  rarity: 'common' | 'rare' | 'epic' | 'legendary';  // 희귀도
}

// 학생이 획득한 배지
export interface StudentBadge {
  id: string;
  studentId: string;
  badgeType: BadgeType;
  unlockedAt: Date;
  isNew: boolean;           // 새로 획득한 배지 (확인 전)
}

// 학사일정
export interface SchoolSchedule {
  id: string;
  startDate: string;        // YYYY-MM-DD (시작일)
  endDate?: string;         // YYYY-MM-DD (종료일, 선택사항)
  eventName: string;        // 행사명
  createdAt: Date;
}

// 시간표
export interface Timetable {
  id: string;
  schedule: {
    [key: string]: string;  // "월-1": "국어", "화-2": "수학" 등
  };
  updatedAt: Date;
}

// NEIS 학교 설정
export interface NeisSettings {
  id: string;
  atptOfcdcScCode: string;  // 시도교육청코드
  sdSchulCode: string;      // 학교코드
  schoolName: string;       // 학교명 (표시용)
  apiKey: string;           // NEIS API 키
  updatedAt: Date;
}

// 칭찬 카테고리
export type PraiseCategory =
  | 'kindness'      // 친절함
  | 'diligence'     // 성실함
  | 'cooperation'   // 협동심
  | 'creativity'    // 창의성
  | 'leadership'    // 리더십
  | 'responsibility'// 책임감
  | 'respect'       // 배려심
  | 'effort'        // 노력
  | 'improvement'   // 발전
  | 'positive';     // 긍정적 태도

// 칭찬
export interface Praise {
  id: string;
  fromId: string;           // 작성자 ID
  fromName: string;         // 작성자 이름
  fromType: 'teacher' | 'student';  // 작성자 유형
  toId: string;             // 대상자 ID
  toName: string;           // 대상자 이름
  toType: 'teacher' | 'student';    // 대상자 유형
  category: PraiseCategory; // 칭찬 카테고리
  content: string;          // 칭찬 내용
  isPublic: boolean;        // 공개 여부
  createdAt: Date;
}

// 학생 개인 목표
export interface StudentGoal {
  id: string;
  studentId: string;
  studentName: string;
  title: string;            // 목표 제목 (예: "매일 퀴즈 1개 만들기")
  description?: string;     // 상세 설명 (선택)
  targetCount: number;      // 목표 횟수 (10회)
  currentCount: number;     // 현재 진행 (3회)
  unit: string;            // 단위 ("회", "일", "개", "권" 등)
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  checkDates: string[];    // 체크한 날짜들 ["2025-01-15", ...]
  currentStreak: number;   // 현재 연속 달성 일수
  longestStreak: number;   // 최장 연속 달성 일수
  status: 'active' | 'completed' | 'failed';  // 진행중/완료/실패
  createdAt: Date;
}

// 미니게임 타입
export type MiniGameType = 'p5js' | 'entry' | 'iframe';

// 미니게임
export interface MiniGame {
  id: string;
  title: string;
  description: string;
  type: MiniGameType;       // p5js / entry / iframe
  gameUrl?: string;         // 엔트리 URL 또는 외부 iframe URL
  p5Code?: string;          // p5.js 코드 (type='p5js'일 때)
  thumbnailUrl?: string;    // 썸네일 이미지
  createdBy: string;        // 제작자 ID (teacher 또는 학생 ID)
  createdByName: string;    // 제작자 이름
  playCount: number;        // 플레이 횟수
  isActive: boolean;        // 활성화 상태
  createdAt: Date;
}

// 포인트 내역 타입
export type PointSourceType =
  | 'assignment'        // 과제 제출
  | 'praise_received'   // 칭찬 받기
  | 'praise_given'      // 칭찬 주기
  | 'goal'              // 목표 달성
  | 'attendance'        // 출석
  | 'admin';            // 선생님 직접 지급/차감

// 포인트 내역
export interface PointHistory {
  id: string;
  studentId: string;
  studentName: string;
  type: 'earn' | 'spend';   // 획득/사용
  amount: number;           // 금액 (양수 또는 음수)
  source: PointSourceType | 'shop';  // 출처
  description: string;      // 설명
  createdAt: Date;
}

// 상점 아이템 카테고리
export type ShopCategory = 'time' | 'privilege';

// 상점 아이템
export interface ShopItem {
  id: string;
  title: string;
  description: string;
  category: ShopCategory;   // 자유시간/특권
  price: number;
  isActive: boolean;        // 판매 중 여부
  createdAt: Date;
}

// 쿠폰 상태
export type CouponStatus = 'unused' | 'pending' | 'approved' | 'expired';

// 쿠폰
export interface Coupon {
  id: string;
  studentId: string;
  studentName: string;
  itemId: string;
  itemTitle: string;
  itemCategory: ShopCategory;
  itemPrice: number;
  purchasedAt: Date;
  expiresAt: Date;          // 유효기간 (구매 후 1개월)
  usedAt?: Date;            // 사용 완료 시간
  status: CouponStatus;     // unused/pending/approved/expired
}
