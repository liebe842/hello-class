import Link from 'next/link';

export default function KioskPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      {/* 상단 바 */}
      <div className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Hello, Class! 🎉</h1>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-sm text-gray-600">2024년 9월 26일</p>
            <p className="text-lg font-bold text-gray-800">목요일</p>
          </div>
          <Link
            href="/"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            홈
          </Link>
        </div>
      </div>

      {/* 메인 메뉴 */}
      <main className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {/* 출석 현황 */}
          <Link href="/kiosk/attendance">
            <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all w-full">
              <div className="text-8xl mb-6">📊</div>
              <h2 className="text-3xl font-bold text-gray-800">출석 현황</h2>
            </button>
          </Link>

          {/* 과제체크 */}
          <Link href="/kiosk/assignments">
            <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all w-full">
              <div className="text-8xl mb-6">📝</div>
              <h2 className="text-3xl font-bold text-gray-800">과제체크</h2>
            </button>
          </Link>

          {/* 오늘의 퀴즈 */}
          <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all">
            <div className="text-8xl mb-6">❓</div>
            <h2 className="text-3xl font-bold text-gray-800">오늘의 퀴즈</h2>
          </button>

          {/* 학교 공지사항 */}
          <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all">
            <div className="text-8xl mb-6">📢</div>
            <h2 className="text-3xl font-bold text-gray-800">학교 공지</h2>
          </button>

          {/* 학급 소식 */}
          <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all">
            <div className="text-8xl mb-6">📰</div>
            <h2 className="text-3xl font-bold text-gray-800">학급 소식</h2>
          </button>

          {/* 미니게임 */}
          <Link href="/kiosk/minigames">
            <button className="bg-white rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all w-full">
              <div className="text-8xl mb-6">🎮</div>
              <h2 className="text-3xl font-bold text-gray-800">미니게임</h2>
            </button>
          </Link>
        </div>
      </main>

      {/* 하단 정보 바 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-90 px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">오늘의 급식</p>
            <p className="font-semibold text-gray-800">김치찌개, 불고기, 잡곡밥</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">다음 수업</p>
            <p className="font-semibold text-gray-800">3교시 - 수학</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">출석률</p>
            <p className="font-semibold text-green-600">24/25 (96%)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
