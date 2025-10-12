import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYYMMDD

    if (!date) {
      return NextResponse.json({ error: 'date 파라미터가 필요합니다' }, { status: 400 });
    }

    // Firestore에서 NEIS 설정 가져오기
    const settingsSnap = await getDocs(collection(db, 'neisSettings'));
    if (settingsSnap.empty) {
      return NextResponse.json({ error: 'NEIS 설정이 없습니다' }, { status: 404 });
    }

    const settings = settingsSnap.docs[0].data();
    const { atptOfcdcScCode, sdSchulCode, apiKey } = settings;

    // NEIS API 호출
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${apiKey}&Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=${atptOfcdcScCode}&SD_SCHUL_CODE=${sdSchulCode}&MLSV_YMD=${date}`;

    const response = await fetch(url);
    const data = await response.json();

    // 에러 처리
    if (data.RESULT) {
      return NextResponse.json({ error: data.RESULT.MESSAGE }, { status: 400 });
    }

    // 데이터 가공
    if (!data.mealServiceDietInfo || !data.mealServiceDietInfo[1]) {
      return NextResponse.json({ meals: [] });
    }

    interface NeisApiMealItem {
      MLSV_YMD: string;
      MMEAL_SC_NM: string;
      DDISH_NM: string;
      CAL_INFO: string;
      NTR_INFO: string;
    }

    const meals = data.mealServiceDietInfo[1].row.map((item: NeisApiMealItem) => ({
      date: item.MLSV_YMD,
      mealName: item.MMEAL_SC_NM, // 조식/중식/석식
      dishName: item.DDISH_NM, // 메뉴
      calInfo: item.CAL_INFO, // 칼로리
      ntrInfo: item.NTR_INFO, // 영양정보
    }));

    return NextResponse.json({ meals });
  } catch (error) {
    console.error('NEIS API 호출 실패:', error);
    return NextResponse.json({ error: '급식 정보를 가져오는데 실패했습니다' }, { status: 500 });
  }
}
