// .env.local에서 환경 변수 로드
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase Project ID:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const POINTS_TO_GRANT = 30;

async function grantPointsToAll() {
  console.log(`모든 학생에게 ${POINTS_TO_GRANT}포인트 지급 시작...\n`);

  try {
    // 모든 학생 가져오기
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      currentPoints: doc.data().points || 0,
    }));

    console.log(`총 ${students.length}명의 학생 발견\n`);

    // 각 학생에게 포인트 지급
    for (const student of students) {
      try {
        const studentRef = doc(db, 'students', student.id);
        const newPoints = student.currentPoints + POINTS_TO_GRANT;

        // 학생 포인트 업데이트
        await updateDoc(studentRef, {
          points: newPoints,
        });

        // 포인트 내역 추가
        await addDoc(collection(db, 'pointHistory'), {
          studentId: student.id,
          studentName: student.name,
          type: 'earn',
          amount: POINTS_TO_GRANT,
          source: 'admin',
          description: '전체 학생 포인트 지급',
          createdAt: Timestamp.now(),
        });

        console.log(`✅ ${student.name}: ${student.currentPoints}P → ${newPoints}P (+${POINTS_TO_GRANT}P)`);
      } catch (error) {
        console.error(`❌ ${student.name} 포인트 지급 실패:`, error);
      }
    }

    console.log(`\n🎉 모든 학생에게 ${POINTS_TO_GRANT}포인트 지급 완료!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

grantPointsToAll();
