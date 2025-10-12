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
  | 'streak_3'             // 3일 연속 출석
  | 'streak_7'             // 7일 연속 출석
  | 'early_bird';          // 일찍 출석 (오전 8시 이전)

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
