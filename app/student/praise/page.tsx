'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, Timestamp, query, orderBy, where, updateDoc, doc, increment } from 'firebase/firestore';
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

export default function StudentPraisePage() {
  const router = useRouter();
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // 칭찬 대상 유형
  const [targetType, setTargetType] = useState<'student' | 'teacher'>('student');

  // 칭찬 작성 폼
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [category, setCategory] = useState<PraiseCategory>('kindness');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 로그인한 학생 정보 가져오기
    const studentData = localStorage.getItem('studentSession');
    if (!studentData) {
      alert('로그인이 필요합니다.');
      router.push('/student/login');
      return;
    }

    const student = JSON.parse(studentData);
    setCurrentStudent(student);

    fetchStudents();
  }, [router]);

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

    if (!currentStudent) {
      alert('로그인 정보를 찾을 수 없습니다.');
      return;
    }

    if (targetType === 'student' && !selectedStudentId) {
      alert('칭찬할 친구를 선택해주세요.');
      return;
    }

    if (targetType === 'student' && selectedStudentId === currentStudent.id) {
      alert('자기 자신에게는 칭찬을 보낼 수 없습니다.');
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
      // 하루 1회 제한 확인 (칭찬 주기)
      const today = new Date().toISOString().split('T')[0];
      const praiseGivenQuery = query(
        collection(db, 'praises'),
        where('fromId', '==', currentStudent.id),
        where('fromType', '==', 'student')
      );
      const praiseGivenSnap = await getDocs(praiseGivenQuery);
      const todayPraiseGiven = praiseGivenSnap.docs.some(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt && createdAt.toISOString().split('T')[0] === today;
      });

      if (todayPraiseGiven) {
        alert('칭찬은 하루에 한 번만 보낼 수 있습니다!');
        setSubmitting(false);
        return;
      }
      let praiseData: Omit<Praise, 'id'>;

      if (targetType === 'teacher') {
        // 선생님께 칭찬
        praiseData = {
          fromId: currentStudent.id,
          fromName: currentStudent.name,
          fromType: 'student',
          toId: 'teacher',
          toName: '선생님',
          toType: 'teacher',
          category,
          content: content.trim(),
          isPublic,
          createdAt: Timestamp.now() as unknown as Date,
        };
      } else {
        // 친구에게 칭찬
        const selectedStudent = students.find(s => s.id === selectedStudentId);
        if (!selectedStudent) {
          alert('학생 정보를 찾을 수 없습니다.');
          setSubmitting(false);
          return;
        }

        praiseData = {
          fromId: currentStudent.id,
          fromName: currentStudent.name,
          fromType: 'student',
          toId: selectedStudent.id,
          toName: selectedStudent.name,
          toType: 'student',
          category,
          content: content.trim(),
          isPublic,
          createdAt: Timestamp.now() as unknown as Date,
        };
      }

      await addDoc(collection(db, 'praises'), praiseData);

      // 칭찬 주기 포인트 (1P)
      await updateDoc(doc(db, 'students', currentStudent.id), {
        points: increment(1),
      });

      await addDoc(collection(db, 'pointHistory'), {
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        type: 'earn',
        amount: 1,
        source: 'praise_given',
        description: `칭찬 보내기`,
        createdAt: Timestamp.now(),
      });

      // 칭찬 받기 포인트 (2P) - 학생에게만
      if (targetType === 'student') {
        // 하루 1회 제한 확인 (칭찬 받기)
        const praiseReceivedQuery = query(
          collection(db, 'praises'),
          where('toId', '==', selectedStudentId),
          where('toType', '==', 'student')
        );
        const praiseReceivedSnap = await getDocs(praiseReceivedQuery);
        const todayPraiseReceived = praiseReceivedSnap.docs.some(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          return createdAt && createdAt.toISOString().split('T')[0] === today;
        });

        if (!todayPraiseReceived) {
          const receivingStudent = students.find(s => s.id === selectedStudentId);
          if (receivingStudent) {
            await updateDoc(doc(db, 'students', selectedStudentId), {
              points: increment(2),
            });

            await addDoc(collection(db, 'pointHistory'), {
              studentId: selectedStudentId,
              studentName: receivingStudent.name,
              type: 'earn',
              amount: 2,
              source: 'praise_received',
              description: `칭찬 받기`,
              createdAt: Timestamp.now(),
            });
          }
        }
      }

      const target = targetType === 'teacher' ? '선생님' : students.find(s => s.id === selectedStudentId)?.name;
      alert(`${target}에게 칭찬을 전달했습니다! 🎉 +1P`);

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

  if (loading || !currentStudent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-800 text-2xl">로딩 중...</div>
      </div>
    );
  }

  // 자기 자신을 제외한 학생 목록
  const otherStudents = students.filter(s => s.id !== currentStudent.id);

  return (
    <div className="p-8">
      {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">✨ 칭찬하기</h1>
          <p className="text-gray-600">
            친구와 선생님의 좋은 모습을 칭찬해주세요. 칭찬은 큰 힘이 됩니다!
          </p>
        </div>

        {/* 칭찬의 힘 안내 */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 mb-8 border-l-4 border-yellow-500">
          <h3 className="font-bold text-lg mb-2">💡 칭찬의 힘</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            진심 어린 칭찬은 상대방에게 긍정적인 변화를 일으킵니다. 친구의 좋은 점을 발견하고 칭찬해주세요!
          </p>
        </div>

        {/* 칭찬 작성 폼 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {/* 칭찬 대상 유형 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                누구를 칭찬할까요? *
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('student');
                    setSelectedStudentId('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-semibold ${
                    targetType === 'student'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
                  }`}
                >
                  👥 친구
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('teacher');
                    setSelectedStudentId('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-semibold ${
                    targetType === 'teacher'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
                  }`}
                >
                  👨‍🏫 선생님
                </button>
              </div>
            </div>

            {/* 학생 선택 (친구를 칭찬할 때만 표시) */}
            {targetType === 'student' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  칭찬할 친구 *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="">친구를 선택하세요</option>
                  {otherStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.grade}학년 {student.class}반 {student.number}번 {student.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                placeholder="구체적으로 칭찬해주세요!&#10;&#10;예시:&#10;- 오늘 청소할 때 먼저 나서서 도와줘서 고마웠어!&#10;- 모둠활동에서 내 의견을 잘 들어줘서 좋았어!&#10;- 수학 문제 설명해줘서 이해가 잘 됐어!"
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
                    (체크 해제 시 해당 친구/선생님만 볼 수 있습니다)
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
                onClick={() => router.push('/student/praise-list')}
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                내 칭찬 보기
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
