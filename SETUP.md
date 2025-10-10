# Hello, Class! 설정 가이드

## 🚀 빠른 시작

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `hello-class` 입력
4. Google Analytics는 선택사항 (불필요)
5. 프로젝트 생성 완료

### 2. Firebase 웹 앱 추가

1. Firebase Console에서 프로젝트 선택
2. 프로젝트 설정 > "앱 추가" > "웹" 선택
3. 앱 닉네임: `Hello Class Web` 입력
4. Firebase SDK 설정 정보 복사

### 3. Firestore Database 생성

1. Firebase Console > "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. **테스트 모드**로 시작 (나중에 규칙 변경 가능)
4. 위치: `asia-northeast3` (서울) 선택

### 4. Firebase Storage 설정

1. Firebase Console > "Storage" 선택
2. "시작하기" 클릭
3. 테스트 모드로 시작
4. 위치: `asia-northeast3` (서울) 선택

### 5. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일을 열고 Firebase 설정 값을 입력하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📁 프로젝트 구조

```
hello-class/
├── app/
│   ├── page.tsx              # 메인 페이지
│   ├── admin/
│   │   ├── page.tsx          # 관리자 대시보드
│   │   ├── students/         # 학생 관리
│   │   └── attendance/       # 출석 현황
│   ├── kiosk/
│   │   ├── page.tsx          # 키오스크 메인
│   │   └── attendance/       # 출석 체크
│   └── student/
│       └── page.tsx          # 학생 대시보드
├── lib/
│   ├── firebase.ts           # Firebase 설정
│   └── types.ts              # TypeScript 타입
└── .env.local                # 환경 변수
```

## 🎯 Phase 2 완성 기능

### ✅ 구현 완료

1. **관리자 페이지**
   - 학생 등록/삭제 기능
   - 실시간 출석 현황 대시보드
   - 감정 분포 분석
   - 미출석 학생 확인

2. **키오스크 페이지**
   - 학생 선택 화면
   - 감정 선택 (9가지 감정)
   - 출석 완료 처리

3. **Firebase 연동**
   - Firestore 데이터베이스
   - 실시간 데이터 동기화
   - 자동 새로고침 (10초마다)

## 🧪 테스트 방법

### 1. 학생 등록
1. http://localhost:3000/admin/students 접속
2. "학생 등록" 버튼 클릭
3. 학생 정보 입력 (이름, 학번, 학년, 반)
4. 등록 완료

### 2. 출석 체크
1. http://localhost:3000/kiosk 접속
2. "출석체크" 클릭
3. 학생 이름 선택
4. 오늘 기분 선택
5. 출석 완료

### 3. 출석 현황 확인
1. http://localhost:3000/admin/attendance 접속
2. 실시간 출석률 확인
3. 감정 분포 확인
4. 미출석 학생 확인

## 🔥 Firebase 보안 규칙 (선택)

Firestore Database > 규칙에서 다음으로 변경:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 학생 컬렉션
    match /students/{document=**} {
      allow read, write: if true;
    }

    // 출석 컬렉션
    match /attendance/{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ 프로덕션 환경에서는 적절한 인증 규칙을 설정하세요.

## 🐛 문제 해결

### Firebase 연결 오류
- `.env.local` 파일의 환경 변수 확인
- Firebase 프로젝트 설정 다시 확인
- 개발 서버 재시작 (`npm run dev`)

### Firestore 권한 오류
- Firebase Console에서 Firestore 보안 규칙 확인
- 테스트 모드로 설정되어 있는지 확인

### 데이터가 표시되지 않음
- Firebase Console에서 Firestore 데이터 직접 확인
- 브라우저 콘솔에서 에러 메시지 확인
- 네트워크 탭에서 Firebase 요청 확인

## 📝 다음 단계 (Phase 3)

- 과제 관리 시스템
- AI 퀴즈 생성
- 학교 API 연동
- Canva 소식지 연동

---

**프로젝트**: Hello, Class! - AI 기반 스마트 학급 관리 시스템
**개발자**: 유경윤 (인천부내초등학교)
