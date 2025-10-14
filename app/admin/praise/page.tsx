'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import type { Student, PraiseCategory, Praise } from '@/lib/types';

const CATEGORY_LABELS: Record<PraiseCategory, string> = {
  kindness: '친절함',
  diligence: '성실함',
  cooperation: '협동심',
  creativity: '창의성',
  leadership: '리더십',
  responsibility: '책임감',
  respect: '배려심',
  effort: '노력',
  improvement: '발전',
  positive: '긍정적 태도',
};

export default function AdminPraisePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // 칭찬 작성 폼
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [category, setCategory] = useState<PraiseCategory>('kindness');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsSnap = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Student[];

      // 클라이언트 측에서 정렬
      studentsData.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        if (a.class !== b.class) return a.class - b.class;
        return a.number - b.number;
      });

      setStudents(studentsData);
      setLoading(false);
    } catch (err) {
      console.error('학생 목록 로드 실패:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      alert('칭찬할 학생을 선택해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('칭찬 내용을 입력해주세요.');
      return;
    }

    // 진정성 있는 칭찬 권장 (최소 10자)
    if (content.trim().length < 10) {
      const confirm = window.confirm(
        '칭찬은 구체적일수록 더 큰 힘이 됩니다.\n더 자세히 작성하시겠어요?'
      );
      if (confirm) return;
    }

    setSubmitting(true);

    try {
      const selectedStudent = students.find(s => s.id === selectedStudentId);
      if (!selectedStudent) {
        alert('학생 정보를 찾을 수 없습니다.');
        setSubmitting(false);
        return;
      }

      const praiseData: Omit<Praise, 'id'> = {
        fromId: 'teacher',
        fromName: '선생님',
        fromType: 'teacher',
        toId: selectedStudent.id,
        toName: selectedStudent.name,
        toType: 'student',
        category,
        content: content.trim(),
        isPublic,
        createdAt: Timestamp.now() as unknown as Date,
      };

      await addDoc(collection(db, 'praises'), praiseData);

      alert(`${selectedStudent.name} 학생에게 칭찬을 전달했습니다!`);

      // 폼 초기화
      setSelectedStudentId('');
      setContent('');
      setCategory('kindness');
      setIsPublic(true);
    } catch (err) {
      console.error('칭찬 작성 실패:', err);
      alert('칭찬을 저장하는데 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            ← 돌아가기
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✨ 칭찬하기</h1>
          <p className="text-gray-600">
            학생들의 긍정적인 행동을 칭찬해주세요. 칭찬은 학생들에게 큰 힘이 됩니다.
          </p>
        </div>

        {/* 칭찬의 힘 안내 */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 mb-8 border-l-4 border-yellow-500">
          <h3 className="font-bold text-lg mb-2">💡 칭찬의 힘</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            &quot;사람들은 자신의 장점을 인정받고 칭찬받기를 간절히 원한다. 진심 어린 칭찬은 상대방에게
            긍정적인 변화를 일으킨다.&quot; - 데일 카네기, 『인간관계론』
          </p>
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-semibold">Tip:</span> 구체적이고 진정성 있는 칭찬일수록 더 큰 효과가 있습니다.
          </div>
        </div>

        {/* 칭찬 작성 폼 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {/* 학생 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                칭찬할 학생 *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              >
                <option value="">학생을 선택하세요</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.grade}학년 {student.class}반 {student.number}번 {student.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 카테고리 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                칭찬 카테고리 *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.keys(CATEGORY_LABELS) as PraiseCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-lg border-2 transition ${
                      category === cat
                        ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* 칭찬 내용 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                칭찬 내용 *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                rows={6}
                placeholder="구체적인 행동과 함께 칭찬해주세요.&#10;&#10;예시:&#10;- 오늘 청소시간에 먼저 나서서 교실 뒤편을 깨끗이 정리해줘서 고마웠어요.&#10;- 모둠활동에서 친구들의 의견을 잘 들어주고 조율하는 모습이 인상적이었어요.&#10;- 어려운 수학 문제를 끝까지 포기하지 않고 해결하려는 모습이 멋졌어요."
                required
              />
              <div className="mt-1 text-sm text-gray-500">
                {content.length}자 {content.length < 10 && '(구체적으로 작성할수록 좋아요!)'}
              </div>
            </div>

            {/* 공개 여부 */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold">공개 칭찬</span>
                  <span className="text-gray-500 ml-2">
                    (체크 해제 시 해당 학생만 볼 수 있습니다)
                  </span>
                </span>
              </label>
            </div>

            {/* 제출 버튼 */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 rounded-lg hover:from-pink-600 hover:to-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '전송 중...' : '✨ 칭찬 전달하기'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/praise-list')}
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                목록 보기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
