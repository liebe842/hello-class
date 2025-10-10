import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full">
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-800">
          Hello, Class! 👋
        </h1>
        <p className="text-center text-gray-600 mb-12">
          AI 기반 스마트 학급 관리 시스템
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 관리자 페이지 */}
          <Link
            href="/admin"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-8 text-center transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="text-5xl mb-4">👨‍🏫</div>
            <h2 className="text-xl font-bold mb-2">관리자</h2>
            <p className="text-sm opacity-90">선생님용 관리 페이지</p>
          </Link>

          {/* 키오스크 페이지 */}
          <Link
            href="/kiosk"
            className="bg-green-500 hover:bg-green-600 text-white rounded-2xl p-8 text-center transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="text-5xl mb-4">🖥️</div>
            <h2 className="text-xl font-bold mb-2">키오스크</h2>
            <p className="text-sm opacity-90">전자칠판용 화면</p>
          </Link>

          {/* 학생 페이지 */}
          <Link
            href="/student"
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl p-8 text-center transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="text-5xl mb-4">👨‍🎓</div>
            <h2 className="text-xl font-bold mb-2">학생</h2>
            <p className="text-sm opacity-90">개인 대시보드</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
