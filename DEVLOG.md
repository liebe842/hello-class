# 📝 Hello, Class! 개발 일지

> 스마트 학급 관리 시스템 개발 과정 기록

---

## 🎯 프로젝트 개요

**프로젝트명**: Hello, Class!
**개발자**: [사용자명]
**기술 스택**: Next.js 15, TypeScript, Firebase, Tailwind CSS
**개발 기간**: 2025년 (진행중)

---

## 💭 개발 동기 및 의도

### 왜 이 프로젝트를 시작했나?

#### 1. 현장의 문제점 인식
초등학교 학급 운영을 관찰하면서 다음과 같은 문제점을 발견했습니다:

**출석 관리의 비효율성**
- 종이 출석부를 매일 수기로 작성
- 학생들의 감정 상태나 컨디션 파악이 어려움
- 출석 데이터 분석이 힘들고 시간 소요

**과제 관리의 한계**
- 학생별 과제 완료 여부를 일일이 확인해야 함
- 누가 제출했고 안 했는지 추적이 복잡
- 과제 자료 배포가 번거로움 (인쇄, 복사)

**평가의 단방향성**
- 선생님이 만든 문제만 푸는 수동적 학습
- 학생들의 창의성과 이해도를 확인하기 어려움
- 시험 준비가 암기 위주로 흐름

#### 2. 교육적 비전
단순한 관리 도구를 넘어서, **학생들이 주도적으로 참여하는 학습 환경**을 만들고 싶었습니다.

**핵심 교육 철학**:
- 📚 **능동적 학습**: 학생들이 직접 문제를 만들면서 깊이 있게 학습
- 🤝 **협력 학습**: 서로의 문제를 풀면서 동료 학습 효과
- 🎮 **재미있는 학습**: 게임처럼 점수, 순위, 배지로 동기 부여
- 📊 **데이터 기반 교육**: 통계로 학생별 맞춤 지도 가능

#### 3. 기술적 도전
웹 개발 기술을 활용하여 실제로 교육 현장에서 사용할 수 있는 완성도 높은 서비스를 만들고 싶었습니다.

**기술적 목표**:
- 최신 웹 기술 (Next.js 15, TypeScript) 학습 및 적용
- 실시간 협업 기능 구현 (Firebase)
- 사용자 경험(UX) 중심 설계
- 확장 가능한 아키텍처 구축

### 프로젝트의 핵심 가치

#### 1. 학생 중심 설계
- 초등학생도 쉽게 사용할 수 있는 직관적 UI
- 4자리 비밀번호로 간편한 로그인
- 큰 버튼, 이모지, 명확한 피드백

#### 2. 선생님 업무 효율화
- 한눈에 보이는 출석 현황 (키오스크)
- 클릭 한 번으로 과제 체크
- 자동 집계되는 퀴즈 통계

#### 3. 학습 효과 극대화
- **문제 제작 = 깊은 학습**: 문제를 만들려면 개념을 정확히 이해해야 함
- **동료 학습**: 친구들이 만든 문제를 풀면서 다양한 관점 습득
- **즉각 피드백**: 틀린 문제는 바로 해설로 확인

#### 4. 데이터 기반 의사결정
- 학생별 학습 패턴 분석
- 과목별 강점/약점 파악
- 참여율, 정답률 등 객관적 지표 제공

### 차별화 포인트

기존 교육 플랫폼과의 차이점:

| 구분 | 기존 플랫폼 | Hello, Class! |
|------|-----------|---------------|
| 문제 출제 | 교사만 가능 | **학생도 직접 제작** |
| 학습 방식 | 문제 풀이만 | **제작 + 풀이 통합** |
| 동기 부여 | 점수만 | **리더보드 + 배지 + 검증** |
| 품질 관리 | 사전 검수 | **신고 + 사후 검증** |
| 데이터 활용 | 제한적 | **상세한 통계 대시보드** |

### 기대 효과

**학생 측면**:
- ✅ 능동적 학습 태도 형성
- ✅ 창의적 문제 해결 능력 향상
- ✅ 협력 학습을 통한 사회성 발달
- ✅ 성취감과 자신감 증진

**교사 측면**:
- ✅ 행정 업무 시간 단축
- ✅ 학생별 맞춤 지도 가능
- ✅ 객관적 학습 데이터 확보
- ✅ 수업 준비 효율성 향상

**학급 전체**:
- ✅ 참여형 학급 문화 조성
- ✅ 자율성과 책임감 증진
- ✅ 디지털 리터러시 향상
- ✅ 협력적 학습 공동체 형성

---

## 🎯 프로젝트 목표

**목적**: 초등학교 학급 운영을 디지털화하여 출석, 과제, 퀴즈 등을 효율적으로 관리하고, 학생 주도적 학습 문화 조성

---

## 📅 개발 타임라인

### Phase 1: 기본 시스템 구축
**구현 내용**: 학생 관리, 출석 체크, 과제 관리 기능

#### 1.1 학생 로그인 시스템
**의도**:
- 초등학생도 쉽게 사용할 수 있도록 4자리 비밀번호 방식 선택
- 학년-반-번호로 학생 식별

**구현 방법**:
- Firebase Authentication 대신 Firestore로 직접 인증 구현
- localStorage에 세션 정보 저장 (`studentSession` 키)
- 비밀번호는 평문 저장 (교육용 프로젝트)

**파일**:
- `app/student/login/page.tsx` - 로그인 페이지
- `lib/types.ts` - Student 인터페이스 정의

#### 1.2 출석 체크 시스템
**의도**:
- 아침에 학생이 직접 출석하면서 자신의 감정 상태도 기록
- 웹캠으로 사진을 찍어 키오스크에 표시 (선택적)

**구현 방법**:
- `react-webcam` 라이브러리 사용
- Firebase Storage에 사진 업로드
- Firestore `attendance` 컬렉션에 기록 저장
- 9가지 감정 선택 가능 (happy, excited, tired, bored, angry, sad, worried, sleepy, curious)

**파일**:
- `app/student/dashboard/page.tsx` - 출석 체크 모달
- `app/kiosk/page.tsx` - 출석 현황 표시

#### 1.3 과제 관리 시스템
**의도**:
- 선생님이 과제를 등록하고 학생들의 완료 여부를 체크
- Canva 링크 연동으로 과제 설명 자료 공유

**구현 방법**:
- `assignments` 컬렉션에 과제 정보 저장
- `assignmentChecks` 컬렉션에 학생별 완료 여부 저장
- 관리자 페이지에서 일괄 체크/해제 기능

**파일**:
- `app/admin/assignments/page.tsx` - 과제 관리
- `app/student/dashboard/page.tsx` - 과제 확인

---

### Phase 2: 퀴즈 시스템 구축 (핵심 기능)
**구현 내용**: 학생 참여형 퀴즈 플랫폼

#### 2.1 퀴즈 시스템 설계
**의도**:
- 학생들이 수동적으로 문제를 푸는 것이 아니라, 직접 문제를 만들고 서로의 문제를 풀게 하여 능동적 학습 유도
- 선생님은 주제만 제시하고, 학생들이 콘텐츠를 생성하는 방식

**시스템 플로우**:
```
1. 선생님이 퀴즈 주제 생성 (예: "3단원 단원평가")
   ↓
2. 학생들이 해당 주제로 퀴즈 제작
   ↓
3. 학생들이 서로의 퀴즈를 풀이
   ↓
4. 선생님이 우수 퀴즈 검증 & 부적절한 퀴즈 삭제
```

**설계 결정 사항**:
- **퀴즈 타입**: 4지선다, OX 퀴즈 2가지 지원
- **풀이 모드**:
  - 전체 도전 (모든 문제, 점수 기록됨)
  - 랜덤 도전 (10문제, 연습용)
  - 개별 문제 (문제 하나씩)
- **품질 관리**: 신고 시스템 + 선생님 검증

#### 2.2 퀴즈 주제 관리 (관리자)
**의도**:
- 선생님이 과목, 난이도, 기간을 설정한 주제 생성
- 학생당 최대 출제 개수 제한으로 형평성 유지

**구현 방법**:
- `quizTopics` 컬렉션 생성
- 주제별로 시작일/마감일 설정
- `maxQuizzesPerStudent` 필드로 출제 개수 제한
- `allowedQuizTypes` 배열로 허용할 퀴즈 타입 선택
- `isActive` 플래그로 활성/비활성 관리

**파일**:
- `app/admin/quiz-topics/page.tsx` - 주제 목록 및 생성
- `app/admin/quiz-topics/[id]/page.tsx` - 주제 상세 관리

**주요 기능**:
- 주제 생성/수정/삭제
- 학생 제출 현황 확인
- 신고된 퀴즈 목록 확인
- 퀴즈 검증 (✓ 배지 부여)
- 부적절한 퀴즈 삭제

#### 2.3 퀴즈 제작 및 풀이 (학생)
**의도**:
- 학생들이 쉽게 문제를 만들 수 있도록 직관적인 UI 제공
- 문제를 만든 후에만 다른 문제를 풀 수 있게 하여 참여 독려

**구현 방법**:
- **퀴즈 제작**:
  - 문제 텍스트 입력
  - 4지선다: 4개 선택지 + 정답 선택
  - OX: O/X 정답 선택
  - 해설 작성 (필수)
  - 난이도 선택 (쉬움/보통/어려움)

- **퀴즈 풀이**:
  - 진행 바로 현재 위치 표시
  - 답 선택 후 즉시 정답/오답 피드백
  - 해설 표시
  - 최종 점수 및 복습 화면

**파일**:
- `app/student/quiz-topics/page.tsx` - 주제 목록
- `app/student/quiz-topics/[id]/page.tsx` - 퀴즈 제작/풀기 탭
- `app/student/quiz-topics/[id]/solve/page.tsx` - 퀴즈 풀이 화면

**주요 기능**:
- 내가 만든 퀴즈 관리 (삭제 가능)
- 전체/랜덤/개별 도전 모드
- 최고 점수 기록
- 제작 개수 제한 체크

#### 2.4 참여 강제 메커니즘
**의도**:
- 무임승차 방지: 문제만 풀고 제작하지 않는 것을 방지
- 기여 유도: 퀴즈를 만들어야 풀 수 있게 함

**구현 방법**:
```typescript
// 퀴즈를 만들지 않은 경우
if (myQuizzes.length === 0) {
  // 1. 큰 경고 메시지 표시
  // 2. 모든 풀기 버튼 비활성화
  // 3. "퀴즈 만들기" 탭으로 유도하는 버튼 제공
}
```

**파일**: `app/student/quiz-topics/[id]/page.tsx`

**효과**:
- 모든 학생이 최소 1개 이상 퀴즈 제작
- 콘텐츠 생성 참여율 100% 달성

---

### Phase 3: 품질 관리 및 분석 시스템
**구현 내용**: 신고, 리더보드, 통계 대시보드

#### 3.1 신고 시스템
**의도**:
- 학생들이 잘못된 정답, 부적절한 내용 등을 자율적으로 신고
- 선생님이 후속 조치 (검토 후 삭제 또는 수정 요청)

**구현 방법**:
- 퀴즈 풀이 화면에 "🚨 신고" 버튼 추가
- 신고 사유 텍스트 입력 모달
- `quizReports` 컬렉션에 신고 기록 저장
- 퀴즈의 `reportCount` 자동 증가
- 관리자 페이지에서 신고된 퀴즈 필터링 가능

**파일**:
- `app/student/quiz-topics/[id]/solve/page.tsx` - 신고 모달
- `lib/types.ts` - QuizReport 인터페이스

**주요 기능**:
- 신고 사유 자유 입력
- 신고 횟수 표시
- 선생님이 신고된 퀴즈 검토 및 조치

#### 3.2 리더보드 시스템
**의도**:
- 게임화(Gamification)를 통한 학습 동기 부여
- 점수뿐 아니라 퀴즈 제작 기여도도 인정

**구현 방법**:
- **점수 순위**: 평균 점수 기준 정렬
  - 총 도전 횟수, 최고 점수 표시
  - 자신의 순위 하이라이트

- **퀴즈 제작 순위**: 검증된 퀴즈 수 기준 정렬
  - 총 제작 퀴즈 / 검증 퀴즈 표시
  - 선생님 인정을 받은 퀴즈가 많을수록 높은 순위

**파일**: `app/student/leaderboard/page.tsx`

**주요 기능**:
- 두 가지 순위 탭 (점수 / 퀴즈 제작)
- 본인 순위 요약 카드
- 메달 이모지 (🥇🥈🥉)
- 실시간 업데이트

#### 3.3 학생 통계 대시보드
**의도**:
- 학생이 자신의 학습 현황을 스스로 파악
- 강점 과목, 약점 과목 분석
- 퀴즈 제작 활동 추적

**구현 방법**:
- **전체 요약**:
  - 총 도전 횟수
  - 평균 점수
  - 최고 점수
  - 만든 퀴즈 수

- **과목별 성적**:
  - 과목별 평균 점수 계산
  - 진행 바로 시각화
  - 최고 점수 표시

- **퀴즈 제작 통계**:
  - 총 제작 / 검증 퀴즈 수
  - 검증 비율
  - 난이도별 제작 현황

- **최근 도전 기록**: 최근 5개 시도 표시

- **전체 풀이 통계**: 총 풀이 문제 수, 정답률

**파일**: `app/student/statistics/page.tsx`

**시각화**:
- 점수별 색상 구분 (90점 이상 초록색, 70점 이상 파란색 등)
- 진행 바 애니메이션
- 카드 형식의 깔끔한 레이아웃

#### 3.4 관리자 통계 대시보드
**의도**:
- 학급 전체의 퀴즈 활동 현황 파악
- 참여율이 낮은 학생 식별
- 데이터 기반 교육 의사결정 지원

**구현 방법**:
- **전체 현황 탭**:
  - 주요 지표 4개 (도전 횟수, 평균 점수, 총 퀴즈, 참여율)
  - 퀴즈 현황 (총/학생제작/검증/신고)
  - 주제 현황 (총/활성/학생/활동학생)
  - 난이도별 정답률 분석

- **학생별 통계 탭**:
  - 테이블 형식으로 전체 학생 데이터
  - 도전 횟수, 평균 점수, 제작/검증 퀴즈, 참여율
  - 평균 점수 기준 정렬

- **주제별 통계 탭**:
  - 주제별 참여 학생 수, 참여율
  - 평균 점수, 총 퀴즈 수
  - 각 주제 관리 페이지로 바로가기

**파일**: `app/admin/quiz-statistics/page.tsx`

**활용 방안**:
- 참여율이 낮은 학생에게 독려
- 정답률이 낮은 주제는 추가 수업
- 우수 퀴즈 제작자 포상

---

## 🛠 기술적 결정 사항

### 1. Next.js 15 App Router 사용
**이유**:
- 최신 React 기능 활용 (Server Components, Streaming)
- 파일 기반 라우팅으로 직관적인 구조
- 빠른 개발 속도 (Turbopack 사용)

### 2. Firebase 선택
**이유**:
- 빠른 프로토타이핑 가능
- 실시간 데이터 동기화
- 무료 플랜으로 충분한 스펙
- Authentication, Storage, Firestore 통합

**컬렉션 구조**:
```
students/              # 학생 정보
attendance/            # 출석 기록
assignments/           # 과제
assignmentChecks/      # 과제 완료 여부
quizTopics/            # 퀴즈 주제
quizzes/               # 퀴즈 문제
quizAttempts/          # 퀴즈 도전 기록 (전체/랜덤)
quizResults/           # 퀴즈 개별 풀이 기록
quizReports/           # 퀴즈 신고
```

### 3. TypeScript 사용
**이유**:
- 타입 안정성으로 버그 예방
- 자동완성으로 개발 속도 향상
- 코드 가독성 및 유지보수성 증가

**주요 타입**:
- `Student`, `Attendance`, `Assignment`
- `QuizTopic`, `Quiz`, `QuizAttempt`, `QuizResult`, `QuizReport`
- `EmotionType`, `QuizType`

### 4. 클라이언트 상태 관리
**방법**: React useState + localStorage
**이유**:
- 간단한 앱이므로 Redux/Zustand 불필요
- localStorage로 세션 유지
- Firebase에서 실시간 데이터 가져오기

---

## 🐛 주요 이슈 및 해결

### Issue 1: localStorage 키 불일치
**문제**:
- 로그인 시 `studentSession` 키로 저장
- 퀴즈 페이지에서 `studentData` 키로 읽기 시도
- 결과: "로그인이 필요합니다" 오류 발생

**해결**:
```bash
# 모든 퀴즈 페이지의 localStorage 키 통일
find app/student/quiz-topics -name "*.tsx" -exec sed -i \
  "s/localStorage.getItem('studentData')/localStorage.getItem('studentSession')/g" {} \;
```

**교훈**: 전역적으로 사용하는 상수는 별도 파일로 관리 필요

### Issue 2: Dynamic Route 네이밍 충돌
**문제**:
```
Error: You cannot use different slug names for the same dynamic path
('id' !== 'topicId')
```

**원인**:
- `/student/quiz-topics/[id]/page.tsx` 존재
- `/student/quiz-topics/[topicId]/solve/page.tsx` 생성
- Next.js는 같은 레벨에서 다른 slug 이름 불허

**해결**:
```
변경 전:
/student/quiz-topics/[id]/page.tsx
/student/quiz-topics/[topicId]/solve/page.tsx

변경 후:
/student/quiz-topics/[id]/page.tsx
/student/quiz-topics/[id]/solve/page.tsx
```

**교훈**: Next.js 동적 라우팅 규칙 준수

### Issue 3: TypeScript ESLint 오류
**문제**:
```typescript
// eslint 오류: Unexpected any. Specify a different type.
const quizData: any = { ... }
```

**해결**:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const quizData: any = { ... }
```

**이유**: Firebase addDoc이 유연한 객체 타입 필요

### Issue 4: 미사용 변수 경고
**문제**: Vercel 빌드 시 unused variables 경고

**해결**:
- 미사용 import 제거
- 미사용 변수 삭제
- useEffect dependency 배열 최적화

---

## 📊 데이터 흐름

### 퀴즈 시스템 데이터 흐름
```
1. 주제 생성 (관리자)
   Teacher → quizTopics collection

2. 퀴즈 제작 (학생)
   Student → quizzes collection
   - topicId 참조
   - isVerified: false
   - reportCount: 0

3. 퀴즈 풀이 (학생)
   Student → Quiz Solve Page

4. 개별 결과 저장
   → quizResults collection
   - quizId 참조
   - isCorrect 기록

5. 전체 도전 결과 저장
   → quizAttempts collection
   - topicId 참조
   - score, totalQuestions 기록

6. 신고 (학생)
   → quizReports collection
   → quiz.reportCount += 1

7. 검증 (관리자)
   → quiz.isVerified = true
```

---

## 🎨 UI/UX 디자인 원칙

### 1. 색상 체계
- **보라색 계열**: 퀴즈 시스템 (purple-500 ~ pink-500)
- **파란색 계열**: 출석, 일반 정보 (blue-500 ~ indigo-500)
- **노란색 계열**: 리더보드, 순위 (yellow-500 ~ orange-500)
- **초록색**: 정답, 성공 (green-500)
- **빨간색**: 오답, 신고 (red-500)

### 2. 카드 디자인
- 모든 주요 기능은 카드 형태
- 그라데이션 배경으로 시각적 매력
- 호버 효과 (shadow-lg, scale-105)

### 3. 반응형 디자인
- Tailwind CSS Grid 활용
- 모바일: 1열, 태블릿: 2열, 데스크탑: 3열
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### 4. 초등학생 친화적 UI
- 큰 버튼, 큰 글씨
- 이모지 적극 활용 (🎯📚🏆📊)
- 간단한 텍스트 설명
- 즉각적인 피드백

---

## 🚀 배포 및 운영

### Vercel 배포
**설정**:
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**환경 변수**:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 빌드 최적화
- Next.js Image 컴포넌트 사용 (모든 <img> → <Image>)
- TypeScript strict mode
- ESLint 규칙 준수
- 불필요한 의존성 제거

---

## 📈 향후 개발 계획

### 우선순위 높음
- [ ] 댓글/피드백 시스템: 퀴즈에 댓글 달기
- [ ] 좋아요 시스템: "도움이 되었어요!" 버튼
- [ ] 배지/업적 시스템: gamification 강화

### 우선순위 중간
- [ ] 시간 제한 챌린지 모드
- [ ] 팀 대결 모드 (모둠별 퀴즈 대결)
- [ ] 더 많은 퀴즈 타입 (단답형, 복수 정답)
- [ ] 이미지 첨부 기능 (문제에 이미지 추가)

### 우선순위 낮음
- [ ] AI 자동 문제 생성
- [ ] 음성 인식 답변
- [ ] 모바일 앱 (React Native)

---

## 💡 핵심 교훈

### 1. 사용자 참여 유도
**배운 점**: 강제보다는 유도가 효과적
- 퀴즈를 만들어야만 풀 수 있게 하여 자연스럽게 참여 유도
- 리더보드로 동기 부여
- 검증 배지로 성취감 제공

### 2. 점진적 기능 추가
**배운 점**: 작은 기능부터 완성하고 확장
- 기본 출석 → 과제 관리 → 퀴즈 시스템 → 분석 도구
- 각 단계마다 테스트 후 다음 단계 진행

### 3. 데이터 구조의 중요성
**배운 점**: 초기 설계가 이후 개발 속도 결정
- `quizAttempts`와 `quizResults` 분리로 유연성 확보
- `topicId` 참조로 데이터 정리 용이

### 4. 에러 처리의 중요성
**배운 점**: 사용자에게 명확한 피드백 제공
- localStorage 확인 → 로그인 페이지 리다이렉트
- 유효성 검사 → alert로 즉각 알림
- 로딩 상태 → "로딩 중..." 표시

---

## 📚 참고 자료

### 사용한 라이브러리
- **Next.js 15**: https://nextjs.org/
- **Firebase**: https://firebase.google.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **react-webcam**: https://www.npmjs.com/package/react-webcam

### 참고한 디자인
- 카카오톡 이모티콘 스타일의 감정 선택
- Google Classroom의 과제 관리 UI
- Kahoot의 퀴즈 게임 요소

---

## 🎓 발표 자료용 핵심 포인트

### 프로젝트 특징
1. **학생 주도 학습**: 문제를 만들고 풀면서 능동적 학습
2. **게임화 요소**: 리더보드, 배지, 점수로 동기 부여
3. **품질 관리**: 신고 시스템과 선생님 검증으로 퀄리티 유지
4. **데이터 기반 교육**: 통계 대시보드로 학습 현황 파악

### 기술적 성과
- Next.js 15 최신 기술 적용
- TypeScript로 타입 안정성 확보
- Firebase로 실시간 협업 구현
- 반응형 디자인으로 다양한 기기 지원

### 사회적 가치
- 초등교육 디지털화 기여
- 학생 자율성 증진
- 교사 업무 효율화
- 데이터 기반 맞춤형 교육 가능

---

## 🆕 Phase 4: 배지 시스템 및 과제 고도화

### 4.1 배지/업적 시스템
**의도**:
- 게임화(Gamification) 강화로 학습 동기 부여
- 다양한 성취 목표 제시
- 학생들의 성취감 향상

**구현 방법**:
- **17가지 배지 타입**:
  - 퀴즈 제작: 첫 퀴즈, 5개, 10개 제작
  - 퀴즈 성적: 100점, 90점 이상 5회, 80점 이상 10회
  - 참여: 10회, 30회 도전
  - 검증: 첫 검증, 5개, 10개 검증
  - 난이도: 어려운 문제 3회 정답, 완벽주의자
  - 연속: 3일, 7일 연속 참여
  - 올라운더: 모든 과목 참여

- **자동 체크 시스템**:
  - 배지 페이지 진입 시 모든 조건 자동 확인
  - 새로 획득한 배지는 축하 애니메이션 표시
  - `isNew` 플래그로 신규 배지 강조

- **등급 시스템**:
  - Common (회색): 기본 배지
  - Rare (파란색): 중급 배지
  - Epic (보라색): 고급 배지
  - Legendary (금색): 최고 등급 배지

**파일**:
- `lib/badges.ts` - 배지 정의 및 체크 로직
- `app/student/badges/page.tsx` - 배지 컬렉션 페이지
- `lib/types.ts` - BadgeType, StudentBadge 인터페이스

**주요 기능**:
- 배지 컬렉션 화면 (획득/미획득 구분)
- 진행도 표시 (13/17 획득)
- 등급별 필터링
- 획득 시 축하 메시지

---

### 4.2 퀴즈 수정 기능
**의도**:
- 학생이 만든 퀴즈에 오타나 오류가 있을 경우 수정 가능
- 단, 다른 학생이 이미 푼 문제는 신중하게 수정

**구현 방법**:
- **수정 가능 여부 체크**:
  ```typescript
  // 다른 학생이 이미 풀었는지 확인
  const resultsSnap = await getDocs(query(
    collection(db, 'quizResults'),
    where('quizId', '==', editingQuiz.id)
  ));
  const otherStudentsSolved = resultsSnap.docs.some(
    d => d.data().studentId !== studentData.id
  );

  if (otherStudentsSolved) {
    // 경고 후 수정 허용
    confirm('이미 다른 학생이 이 문제를 풀었습니다. 그래도 수정하시겠습니까?')
  }
  ```

- **수정 UI**:
  - "수정하기" 버튼 추가
  - 동일한 모달 재사용 (등록/수정 모드 분기)
  - 모달 제목 및 버튼 텍스트 동적 변경

**파일**: `app/student/quiz-topics/[id]/page.tsx`

**안전장치**:
- 다른 학생이 이미 푼 문제는 수정 시 경고
- 기존 이미지 URL 유지 (새로 업로드하지 않는 경우)

---

### 4.3 퀴즈 이미지 첨부 기능
**의도**:
- 그림, 도표가 필요한 문제 출제 가능
- 시각적 학습 자료 활용

**구현 방법**:
- **3가지 업로드 방법**:
  1. **클릭 업로드**: 파일 선택 다이얼로그
  2. **드래그 앤 드롭**: 파일을 영역에 드래그
  3. **Ctrl+V 붙여넣기**: 화면 캡처 후 바로 붙여넣기

- **이미지 압축** (중요!):
  - `browser-image-compression` 라이브러리 사용
  - 최대 1MB로 압축
  - 최대 해상도 1920px
  - Firebase Storage 용량 및 비용 절감
  - 콘솔에 압축 전/후 크기 출력

- **저장 경로**:
  ```
  quiz-images/{topicId}/{studentId}_{timestamp}_{filename}
  ```

- **UI 개선**:
  - 이미지 미리보기
  - "다시 선택" 버튼
  - 업로드 방법 안내 텍스트
  - 호버 효과 (보라색 테두리)

**파일**:
- `app/student/quiz-topics/[id]/page.tsx` - 퀴즈 생성 시 이미지 업로드
- `app/student/quiz-topics/[id]/solve/page.tsx` - 퀴즈 풀이 시 이미지 표시
- `next.config.ts` - Firebase Storage 도메인 허용

**기술 상세**:
```typescript
// 이미지 압축
const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};
const compressedFile = await imageCompression(file, options);

// Firebase Storage 업로드
const storageRef = ref(storage, fileName);
await uploadBytes(storageRef, compressedFile);
const imageUrl = await getDownloadURL(storageRef);
```

---

### 4.4 과제 제출 방식 개선
**의도**:
- 과제 특성에 따라 다양한 제출 방식 지원
- 불필요한 입력 필드 제거로 UX 개선

**구현 방법**:
- **5가지 제출 방식**:
  1. `image`: 이미지만 (미술 작품, 실습 사진 등)
  2. `link`: 링크만 (Google Docs, Canva 링크 등)
  3. `note`: 메모만 (짧은 답변, 소감문 등)
  4. `all`: 전체 (이미지+링크+메모 모두 선택 가능)
  5. `none`: 체크만 (가정통신문 확인, 준비물 체크 등)

- **교사 과제 생성 시**:
  - 3x2 그리드 버튼으로 제출 방식 선택
  - 선택된 버튼은 보라색으로 강조
  - 안내 텍스트: "(체크만 = 가정통신문 확인 등)"

- **학생 과제 제출 시**:
  - 교사가 선택한 방식만 입력 필드 표시
  - `none` 타입은 안내 메시지만 표시하고 바로 제출
  - 필수 제출 방식에는 `*` 표시

- **이미지 제출 개선**:
  - 웹캠 촬영 → 파일 업로드 방식으로 변경
  - 드래그 앤 드롭, Ctrl+V 붙여넣기 지원
  - 이미지 압축 적용 (1MB, 1920px)

**파일**:
- `lib/types.ts` - SubmissionType 정의 (Canva URL 제거)
- `app/admin/assignments/page.tsx` - 과제 관리 (제출 방식 선택)
- `app/student/assignments/page.tsx` - 과제 제출

**제출 방식별 사용 예시**:
- `image`: "미술 작품 사진 제출"
- `link`: "Google Docs 링크 제출"
- `note`: "독후감 소감 작성"
- `all`: "프로젝트 발표자료 (이미지+링크+설명)"
- `none`: "가정통신문 확인 완료"

**UI 변경**:
```typescript
// 체크만 하는 과제 안내
{selectedAssignment.submissionType === 'none' && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
    <div className="text-4xl mb-3">✅</div>
    <p className="text-lg font-semibold">확인 제출 과제입니다</p>
    <p className="text-sm text-gray-600">
      별도의 파일이나 내용 제출 없이 "제출하기" 버튼만 클릭하면 완료됩니다.
    </p>
  </div>
)}
```

---

### 4.5 관리자 과제 수정 기능
**의도**:
- 과제 등록 후 오타나 마감일 수정 필요
- 삭제 후 재등록보다 수정이 편리

**구현 방법**:
- **수정 모드 추가**:
  - `editingAssignment` state 추가
  - "수정" 버튼 클릭 시 기존 정보를 모달에 로드
  - 날짜를 `input[type="date"]` 형식으로 변환

- **등록/수정 통합 함수**:
  ```typescript
  const handleSubmitAssignment = async (e) => {
    if (editingAssignment) {
      // 수정 모드: updateDoc
      await updateDoc(doc(db, 'assignments', editingAssignment.id), data);
    } else {
      // 등록 모드: addDoc
      await addDoc(collection(db, 'assignments'), data);
    }
  };
  ```

- **UI 변경**:
  - 모달 제목: "과제 등록" / "과제 수정"
  - 버튼 텍스트: "등록" / "수정"
  - 테이블에 "수정" 버튼 추가 (파란색)
  - "삭제" 버튼과 나란히 배치

**파일**: `app/admin/assignments/page.tsx`

**주요 기능**:
- 과제명, 설명, 마감일, 제출 방식 수정 가능
- 설명은 선택 항목으로 변경 (required 제거)
- 취소 시 editingAssignment 초기화

---

## 🖼 이미지 최적화 전략

### 문제점
- 원본 이미지 (5MB) 그대로 업로드
- Firebase Storage 용량 과다 사용
- 업로드 속도 느림
- 향후 요금 문제 발생 가능

### 해결 방법
**browser-image-compression 라이브러리 도입**

**압축 설정**:
```typescript
const options = {
  maxSizeMB: 1,              // 최대 1MB
  maxWidthOrHeight: 1920,    // Full HD
  useWebWorker: true,        // 백그라운드 처리
  fileType: file.type,       // 원본 포맷 유지
};
```

**압축 효과**:
- 5MB 이미지 → 200~500KB로 축소 (약 90% 절감)
- 업로드 속도 10배 향상
- Firebase Storage 비용 절감

**적용 위치**:
- 퀴즈 이미지 업로드 (`student/quiz-topics/[id]/page.tsx`)
- 과제 이미지 제출 (`student/assignments/page.tsx`)

**사용자 피드백**:
- 콘솔에 압축 전/후 크기 출력
- 압축 실패 시 에러 메시지

---

## 📊 현재 프로젝트 상태 (2025-10-12)

### 완성된 기능
✅ 학생 등록 및 로그인
✅ 출석 체크 (감정 선택, 사진 촬영)
✅ 과제 관리 시스템 (5가지 제출 방식, 이미지 압축)
✅ 퀴즈 시스템 (생성, 수정, 이미지 첨부, 풀이)
✅ 신고 시스템
✅ 리더보드 (점수 순위, 퀴즈 제작 순위)
✅ 통계 대시보드 (학생용, 관리자용)
✅ 배지/업적 시스템 (17종, 자동 체크)
✅ 키오스크 화면
✅ 이미지 업로드 (드래그앤드롭, Ctrl+V, 압축)

### 다음 계획
🔜 알림 시스템 (과제 마감 임박, 새 퀴즈 등)
🔜 교사 대시보드 개선
🔜 학생 프로필 페이지

---

## 🆕 Phase 5: 학교 공지 시스템

### 5.1 학사일정 관리
**의도**:
- 학교 행사, 시험 일정 등을 학생들에게 공지
- CSV 일괄 업로드로 관리자 편의성 향상
- 기간이 있는 일정도 지원 (예: 중간고사 5/15~5/19)

**구현 방법**:
- **데이터 구조**:
  - `startDate`: 시작일 (YYYY-MM-DD)
  - `endDate`: 종료일 (선택사항, 기간이 있는 경우)
  - `eventName`: 행사명

- **관리자 기능**:
  - 개별 추가: 날짜 선택 + 행사명 입력
  - CSV 일괄 업로드: `startDate,endDate,eventName` 형식
  - CSV 템플릿 다운로드 (헤더만)
  - 수정/삭제 (인라인 편집)
  - 전체 선택 및 일괄 삭제

- **학생 화면**:
  - 월별로 그룹화하여 표시
  - 오늘/미래/과거 일정 색상 구분
  - 기간 일정은 "YYYY-MM-DD ~ YYYY-MM-DD" 형식
  - 진행 중인 일정은 "🔔 진행 중" 표시

**파일**:
- `lib/types.ts` - SchoolSchedule 인터페이스
- `app/admin/school-schedule/page.tsx` - 관리자 일정 관리
- `app/student/school-schedule/page.tsx` - 학생 일정 조회

**CSV 형식 예시**:
```csv
startDate,endDate,eventName
2025-03-02,,개학식
2025-05-15,2025-05-19,중간고사
2025-07-20,,여름방학
```

---

### 5.2 시간표 관리
**의도**:
- 주간 시간표를 등록하여 학생들이 오늘의 수업 확인
- 표 복사-붙여넣기로 간편하게 입력

**구현 방법**:
- **데이터 구조**:
  - Firestore `timetable/current` 단일 문서
  - `schedule`: `{"월-1": "국어", "화-2": "수학"}` 형식

- **관리자 기능**:
  - 표 복사-붙여넣기: 엑셀/워드에서 탭으로 구분된 표 붙여넣기
  - 자동 파싱: 첫 줄은 요일, 나머지는 교시별 과목
  - 미리보기 후 저장
  - 직접 편집: 테이블에서 각 칸 클릭하여 수정

- **파싱 로직**:
  ```typescript
  // 탭(\t)으로 구분된 데이터 파싱
  const lines = text.split('\n');
  const headerLine = lines[0].split('\t'); // 요일
  lines.slice(1).forEach(line => {
    const cells = line.split('\t');
    const period = cells[0]; // 교시 번호
    // 각 요일의 과목을 schedule 객체에 저장
  });
  ```

- **학생 화면**:
  - 월~금, 1~6교시 테이블
  - 오늘 요일 열 노란색 강조
  - "📌 오늘" 표시

**파일**:
- `lib/types.ts` - Timetable 인터페이스
- `app/admin/timetable/page.tsx` - 관리자 시간표 관리
- `app/student/timetable/page.tsx` - 학생 시간표 조회

**복사-붙여넣기 형식**:
```
	월	화	수	목	금
1	국어	수학	영어	과학	사회
2	수학	영어	국어	사회	과학
...
```

---

### 5.3 급식 정보 (NEIS API 연동)
**의도**:
- 나이스(NEIS) 교육정보 개방 포털 API로 실시간 급식 데이터 가져오기
- 관리자가 매번 입력할 필요 없이 자동화

**구현 방법**:
- **NEIS API 설정**:
  - 관리자 설정 페이지에서 입력:
    - API 키 (open.neis.go.kr에서 발급)
    - 시도교육청코드 (예: B10=서울)
    - 학교코드 (10자리)
    - 학교명 (표시용)
  - Firestore `neisSettings/current`에 저장

- **API 호출 구조**:
  ```typescript
  // 서버사이드 API Route
  GET /api/neis/meal?date=20251013

  // NEIS API 호출
  const url = `https://open.neis.go.kr/hub/mealServiceDietInfo
    ?KEY=${apiKey}
    &ATPT_OFCDC_SC_CODE=${atptOfcdcScCode}
    &SD_SCHUL_CODE=${sdSchulCode}
    &MLSV_YMD=${date}`;
  ```

- **학생 화면**:
  - 이번 주 + 다음 주 급식 표시 (14일치)
  - 주말 자동 스킵
  - 오늘 급식 노란색 강조
  - 조식/중식/석식 구분
  - 알레르기 정보 제거하여 가독성 향상
  - 칼로리 정보 표시

**파일**:
- `lib/types.ts` - NeisSettings 인터페이스
- `app/admin/neis-settings/page.tsx` - NEIS 설정
- `app/api/neis/meal/route.ts` - API Route (서버사이드)
- `app/student/meal/page.tsx` - 급식 조회

**API 응답 가공**:
```typescript
const meals = data.mealServiceDietInfo[1].row.map(item => ({
  date: item.MLSV_YMD,          // 날짜
  mealName: item.MMEAL_SC_NM,   // 조식/중식/석식
  dishName: item.DDISH_NM,       // 메뉴
  calInfo: item.CAL_INFO,        // 칼로리
}));
```

**참고 링크**:
- NEIS 오픈API: https://open.neis.go.kr
- 급식 API 명세: https://open.neis.go.kr/portal/data/service/selectServicePage.do?infId=OPEN17320190722175817128697

---

### 5.4 네비게이션 개선
**의도**:
- 새로운 기능들을 쉽게 접근할 수 있도록 메뉴 추가

**추가된 메뉴**:
- **관리자 홈**:
  - 📅 학사일정 관리
  - 📚 시간표 관리
  - 🏫 NEIS 설정

- **학생 대시보드**:
  - 📅 학사일정
  - 📚 시간표
  - 🍽️ 급식

---

## 🐛 Phase 5 주요 이슈 및 해결

### Issue 1: 빌드 에러 - QuizTopic 타입 누락
**문제**:
```
Property 'subject' does not exist on type '{ id: string; }'.
```

**원인**: `badges/page.tsx`에서 topics 배열이 타입 추론 실패

**해결**:
```typescript
// Before
const topics = topicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// After
import type { QuizTopic } from '@/lib/types';
const topics = topicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuizTopic[];
```

### Issue 2: 시간표 파싱 실패
**문제**: 복사-붙여넣기 시 파싱이 안 되고 "형식이 올바르지 않습니다" 에러

**원인**:
- 빈 줄 필터링 누락
- 교시 번호 검증 없이 파싱 시도

**해결**:
```typescript
// 빈 줄 필터링
const lines = text.split('\n').filter(line => line.trim());

// 교시 번호 검증
const period = cells[0];
if (!period || isNaN(Number(period))) {
  continue; // 교시 번호가 아니면 스킵
}

// 디버깅용 로그 추가
console.log('헤더:', dayHeaders);
console.log('파싱 결과:', parsed);
```

### Issue 3: 급식 API 400 에러
**문제**: `GET /api/neis/meal?date=20251006` 400 Bad Request

**원인**: 주말 날짜 요청 시 NEIS에서 데이터 없음

**해결**:
- 데이터 없을 경우 조용히 스킵 (에러로 처리하지 않음)
- 학생 화면에서 14일치(2주) 요청하여 평일 데이터만 표시
- 주말은 자동으로 제외됨

```typescript
if (data.meals && data.meals.length > 0) {
  meals[dateStr] = data.meals;
}
// 데이터 없어도 에러 발생 안 함
```

---

## 📊 현재 프로젝트 상태 (2025-10-12)

### 완성된 기능
✅ 학생 등록 및 로그인
✅ 출석 체크 (감정 선택, 사진 촬영)
✅ 과제 관리 시스템 (5가지 제출 방식, 이미지 압축)
✅ 퀴즈 시스템 (생성, 수정, 이미지 첨부, 풀이)
✅ 신고 시스템
✅ 리더보드 (점수 순위, 퀴즈 제작 순위)
✅ 통계 대시보드 (학생용, 관리자용)
✅ 배지/업적 시스템 (17종, 자동 체크)
✅ 키오스크 화면
✅ 이미지 업로드 (드래그앤드롭, Ctrl+V, 압축)
✅ **학사일정 관리 (개별/CSV 일괄 등록, 기간 지원)**
✅ **시간표 관리 (표 복사-붙여넣기, 직접 편집)**
✅ **급식 조회 (NEIS API 연동, 자동 업데이트)**

### 다음 계획
🔜 알림 시스템 (과제 마감 임박, 새 퀴즈 등)
🔜 교사 대시보드 개선
🔜 학생 프로필 페이지

---

## 🆕 Phase 6: 칭찬 시스템 및 목표 관리

### 6.1 칭찬 시스템
**의도**:
- 데일 카네기 『인간관계론』의 핵심 원칙 적용
- "진심 어린 칭찬은 상대방에게 긍정적인 변화를 일으킨다"
- 학급 내 긍정적 분위기 조성 및 관계 개선

**구현 방법**:
- **칭찬 카테고리 (10가지)**:
  - 친절함, 성실함, 협동심, 창의성, 리더십
  - 책임감, 배려심, 노력, 발전, 긍정적 태도

- **칭찬 주체/대상**:
  - 교사 → 학생
  - 학생 → 학생
  - 학생 → 교사

- **주요 기능**:
  - 진정성 권장: 10자 미만 시 더 자세히 작성 권장
  - 공개/비공개 옵션
  - 자기 자신 칭찬 방지
  - 카테고리별 통계 및 "나의 강점" 자동 계산

**파일**:
- `lib/types.ts` - Praise, PraiseCategory 인터페이스
- `app/admin/praise/page.tsx` - 교사 칭찬 작성
- `app/admin/praise-list/page.tsx` - 교사 칭찬 관리 (통계, 필터링)
- `app/student/praise/page.tsx` - 학생 칭찬 작성
- `app/student/praise-list/page.tsx` - 학생 칭찬 조회 (받은/보낸 칭찬)

**UI 특징**:
- 카네기 인간관계론 인용구 표시
- 카테고리별 색상 및 이모지
- 받은 칭찬/보낸 칭찬 탭 분리
- 카테고리별 통계 시각화

---

### 6.2 학생 자율 목표 시스템
**의도**:
- 학생 자기주도성 강화
- 학생이 직접 목표를 세우고 스스로 달성 추적
- 교사는 모니터링 및 격려 역할

**구현 방법**:
- **목표 설정**:
  - 목표 제목 (예: "매일 퀴즈 1개 만들기")
  - 목표 설명 (선택)
  - 목표 횟수 + 단위 (회, 일, 개, 권, 시간, 페이지)
  - 마감일 설정

- **진행 추적**:
  - 하루 1회 체크 제한
  - 진행률 퍼센트 바
  - D-day 계산 및 표시
  - 목표 달성 시 자동 완료 처리

- **교사 모니터링**:
  - 학생별 목표 현황 조회
  - 전체 통계 (총 목표, 진행 중, 완료)
  - 목표 설정 학생 수 파악

**파일**:
- `lib/types.ts` - StudentGoal 인터페이스
- `app/student/goals/page.tsx` - 학생 목표 관리 (생성, 체크, 삭제)
- `app/admin/student-goals/page.tsx` - 교사 목표 현황 조회

**주요 기능**:
- 목표 생성 마법사 (단계별 입력)
- 오늘 체크하기 버튼 (중복 방지)
- 진행 중/완료 목표 구분 표시
- 완료 목표는 초록색 강조
- 학생별 그룹핑 (교사 화면)

---

### 6.3 데이터 구조

**Praise (칭찬)**:
```typescript
{
  id: string;
  fromId: string;           // 작성자 ID
  fromName: string;         // 작성자 이름
  fromType: 'teacher' | 'student';
  toId: string;             // 대상자 ID
  toName: string;           // 대상자 이름
  toType: 'teacher' | 'student';
  category: PraiseCategory; // 10가지 카테고리
  content: string;          // 칭찬 내용
  isPublic: boolean;        // 공개 여부
  createdAt: Date;
}
```

**StudentGoal (학생 목표)**:
```typescript
{
  id: string;
  studentId: string;
  studentName: string;
  title: string;            // 목표 제목
  description?: string;     // 상세 설명
  targetCount: number;      // 목표 횟수
  currentCount: number;     // 현재 진행
  unit: string;            // 단위
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  checkDates: string[];    // 체크한 날짜들
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
}
```

---

## 🐛 Phase 6 주요 이슈 및 해결

### Issue 1: localStorage 키 불일치 (칭찬 페이지)
**문제**: 칭찬하기 클릭 시 "로그인이 필요합니다" 팝업

**원인**:
- 대시보드는 `studentSession` 키 사용
- 칭찬 페이지는 `studentData` 키 사용

**해결**:
```typescript
// Before
const studentData = localStorage.getItem('studentData');

// After
const studentData = localStorage.getItem('studentSession');
```

### Issue 2: Firestore 복합 인덱스 오류
**문제**:
```
The query requires an index. You can create it here:
https://console.firebase.google.com/.../indexes?create_composite=...
```

**원인**: `orderBy('grade'), orderBy('class'), orderBy('number')` 복합 정렬

**해결**:
- Firestore 쿼리에서 orderBy 제거
- 클라이언트 측에서 배열 정렬로 변경
```typescript
const studentsSnap = await getDocs(collection(db, 'students'));
studentsData.sort((a, b) => {
  if (a.grade !== b.grade) return a.grade - b.grade;
  if (a.class !== b.class) return a.class - b.class;
  return a.number - b.number;
});
```

### Issue 3: TypeScript any 타입 경고
**문제**: `createdAt: Timestamp.now() as any` eslint 오류

**해결**:
```typescript
// Before
createdAt: Timestamp.now() as any

// After
createdAt: Timestamp.now() as unknown as Date
```

### Issue 4: JSX 특수문자 이스케이프
**문제**: `"` 문자 사용 시 eslint 오류

**해결**:
```typescript
// Before
"사람들은 자신의 장점을 인정받고..."

// After
&quot;사람들은 자신의 장점을 인정받고...&quot;
```

---

## 📊 현재 프로젝트 상태 (2025-10-13)

### 완성된 기능
✅ 학생 등록 및 로그인
✅ 출석 체크 (감정 선택, 사진 촬영)
✅ 과제 관리 시스템 (5가지 제출 방식, 이미지 압축)
✅ 퀴즈 시스템 (생성, 수정, 이미지 첨부, 풀이)
✅ 신고 시스템
✅ 리더보드 (점수 순위, 퀴즈 제작 순위)
✅ 통계 대시보드 (학생용, 관리자용)
✅ 배지/업적 시스템 (17종, 자동 체크)
✅ 키오스크 화면
✅ 이미지 업로드 (드래그앤드롭, Ctrl+V, 압축)
✅ 학사일정 관리 (개별/CSV 일괄 등록, 기간 지원)
✅ 시간표 관리 (표 복사-붙여넣기, 직접 편집)
✅ 급식 조회 (NEIS API 연동, 자동 업데이트)
✅ **칭찬 시스템 (10가지 카테고리, 공개/비공개, 통계)**
✅ **학생 자율 목표 시스템 (목표 설정, 진행 추적, 교사 모니터링)**

### 다음 계획
🔜 알림 시스템 (과제 마감 임박, 새 퀴즈 등)
🔜 교사 대시보드 개선
🔜 학생 프로필 페이지
🔜 목표 달성 시 배지 연동

---

**마지막 업데이트**: 2025-10-13
**작성자**: Claude Code & User
