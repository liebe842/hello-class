import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Hello, Class! - 관리자</h1>
          <Link
            href="/"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            홈으로
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 학급 현황 카드 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📊 학급 현황</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">전체 학생</span>
                <span className="font-bold text-blue-600">0명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">오늘 출석률</span>
                <span className="font-bold text-green-600">0%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">과제 완료율</span>
                <span className="font-bold text-purple-600">0%</span>
              </div>
            </div>
          </div>

          {/* 학생 관리 카드 */}
          <Link href="/admin/students">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">👥 학생 관리</h2>
              <p className="text-gray-600 mb-4">학생 정보를 등록하고 관리합니다.</p>
              <div className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition text-center">
                학생 등록하기
              </div>
            </div>
          </Link>

          {/* 출석 현황 카드 */}
          <Link href="/admin/attendance">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">✅ 출석 현황</h2>
              <p className="text-gray-600 mb-4">실시간 출석 상황을 확인합니다.</p>
              <div className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition text-center">
                출석 확인하기
              </div>
            </div>
          </Link>

          {/* 과제 관리 카드 */}
          <Link href="/admin/assignments">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📝 과제 관리</h2>
              <p className="text-gray-600 mb-4">과제를 등록하고 관리합니다.</p>
              <div className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition text-center">
                과제 등록하기
              </div>
            </div>
          </Link>

          {/* 과제 제출 현황 카드 */}
          <Link href="/admin/assignment-submissions">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📊 과제 제출 현황</h2>
              <p className="text-gray-600 mb-4">학생별 과제 제출 현황을 확인합니다.</p>
              <div className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition text-center">
                제출 현황 보기
              </div>
            </div>
          </Link>

          {/* 퀴즈 주제 관리 카드 */}
          <Link href="/admin/quiz-topics">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">🎯 퀴즈 주제 관리</h2>
              <p className="text-gray-600 mb-4">학생들이 퀴즈를 만들 주제를 관리합니다.</p>
              <div className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-lg transition text-center">
                주제 관리하기
              </div>
            </div>
          </Link>
          {/* 퀴즈 통계 카드 */}
          <Link href="/admin/quiz-statistics">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📊 퀴즈 통계</h2>
              <p className="text-gray-600 mb-4">학급 전체 퀴즈 활동 현황을 확인합니다.</p>
              <div className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition text-center">
                통계 보기
              </div>
            </div>
          </Link>

          {/* 학사일정 관리 카드 */}
          <Link href="/admin/school-schedule">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📅 학사일정 관리</h2>
              <p className="text-gray-600 mb-4">학사일정을 등록하고 관리합니다.</p>
              <div className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition text-center">
                일정 관리하기
              </div>
            </div>
          </Link>

          {/* 시간표 관리 카드 */}
          <Link href="/admin/timetable">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📚 시간표 관리</h2>
              <p className="text-gray-600 mb-4">시간표를 등록하고 관리합니다.</p>
              <div className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition text-center">
                시간표 관리하기
              </div>
            </div>
          </Link>

          {/* NEIS 설정 카드 */}
          <Link href="/admin/neis-settings">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">🏫 NEIS 설정</h2>
              <p className="text-gray-600 mb-4">급식 API 연동을 위한 학교 정보를 설정합니다.</p>
              <div className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition text-center">
                설정하기
              </div>
            </div>
          </Link>

          {/* 칭찬하기 카드 */}
          <Link href="/admin/praise">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">✨ 칭찬하기</h2>
              <p className="text-gray-600 mb-4">학생들에게 칭찬을 전달하고 긍정적인 변화를 이끌어보세요.</p>
              <div className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 rounded-lg transition text-center">
                칭찬 작성하기
              </div>
            </div>
          </Link>

          {/* 칭찬 관리 카드 */}
          <Link href="/admin/praise-list">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📋 칭찬 관리</h2>
              <p className="text-gray-600 mb-4">전체 칭찬 목록을 확인하고 관리합니다.</p>
              <div className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition text-center">
                목록 보기
              </div>
            </div>
          </Link>

          {/* 학생 목표 현황 카드 */}
          <Link href="/admin/student-goals">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-bold mb-4 text-gray-800">🎯 학생 목표 현황</h2>
              <p className="text-gray-600 mb-4">학생들이 설정한 목표를 확인하고 응원합니다.</p>
              <div className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition text-center">
                목표 보기
              </div>
            </div>
          </Link>

          {/* AI 분석 리포트 카드 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📈 AI 분석</h2>
            <p className="text-gray-600 mb-4">학생별 데이터 분석 리포트를 확인합니다.</p>
            <button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg transition">
              분석 보기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
