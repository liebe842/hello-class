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

// 퀴즈
export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 정답 인덱스
  explanation: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  generatedByAI: boolean;
}

// 퀴즈 결과
export interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  selectedAnswer: number;
  isCorrect: boolean;
  answeredAt: Date;
  responseTime: number; // 응답 시간 (초)
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
