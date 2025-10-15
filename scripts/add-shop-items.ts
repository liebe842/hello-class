// .env.local에서 환경 변수 로드
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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

const shopItems = [
  {
    title: '자유시간 10분',
    description: '쉬는 시간을 10분 더 가질 수 있어요',
    category: 'time',
    price: 10,
    isActive: true,
  },
  {
    title: '좌석 변경권',
    description: '원하는 자리로 이동할 수 있어요 (1주일)',
    category: 'privilege',
    price: 30,
    isActive: true,
  },
  {
    title: '과제 제출 연장권',
    description: '과제 제출 기한을 1일 연장할 수 있어요',
    category: 'privilege',
    price: 25,
    isActive: true,
  },
  {
    title: '숙제 면제권',
    description: '숙제 1개를 면제받을 수 있어요',
    category: 'privilege',
    price: 50,
    isActive: true,
  },
  {
    title: '음악 듣기 허가권',
    description: '자습시간에 이어폰으로 음악을 들을 수 있어요',
    category: 'privilege',
    price: 35,
    isActive: true,
  },
  {
    title: '간식 반입 허가권',
    description: '교실에서 간식을 먹을 수 있어요',
    category: 'privilege',
    price: 20,
    isActive: true,
  },
];

async function addShopItems() {
  console.log('상점 아이템 추가 시작...');

  for (const item of shopItems) {
    try {
      await addDoc(collection(db, 'shopItems'), {
        ...item,
        createdAt: Timestamp.now(),
      });
      console.log(`✅ ${item.title} 추가 완료 (${item.price}P)`);
    } catch (error) {
      console.error(`❌ ${item.title} 추가 실패:`, error);
    }
  }

  console.log('\n🎉 모든 아이템 추가 완료!');
  process.exit(0);
}

addShopItems();
