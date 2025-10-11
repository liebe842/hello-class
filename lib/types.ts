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

// 과제
export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  canvaUrl?: string;
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
