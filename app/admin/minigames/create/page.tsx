'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { MiniGameType } from '@/lib/types';

export default function CreateMiniGamePage() {
  const router = useRouter();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [gameType, setGameType] = useState<MiniGameType>('entry');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [p5Code, setP5Code] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 썸네일 파일 선택
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // p5.js 기본 템플릿
  const p5Template = `function setup() {
  createCanvas(800, 600);
  background(220);
}

function draw() {
  // 여기에 게임 로직 작성
  fill(255, 0, 0);
  ellipse(mouseX, mouseY, 50, 50);
}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('게임 제목을 입력해주세요.');
      return;
    }

    if (gameType === 'p5js' && !p5Code.trim()) {
      alert('p5.js 코드를 입력해주세요.');
      return;
    }

    if ((gameType === 'entry' || gameType === 'iframe') && !gameUrl.trim()) {
      alert('게임 URL을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      let thumbnailUrl = '';

      // 썸네일 업로드
      if (thumbnailFile) {
        const timestamp = Date.now();
        const storageRef = ref(storage, `minigames/thumbnails/${timestamp}_${thumbnailFile.name}`);
        await uploadBytes(storageRef, thumbnailFile);
        thumbnailUrl = await getDownloadURL(storageRef);
      }

      // Firestore에 게임 정보 저장 (undefined 필드 제외)
      const gameData: {
        title: string;
        description: string;
        type: MiniGameType;
        createdBy: string;
        createdByName: string;
        playCount: number;
        isActive: boolean;
        createdAt: ReturnType<typeof Timestamp.now>;
        gameUrl?: string;
        p5Code?: string;
        thumbnailUrl?: string;
      } = {
        title: title.trim(),
        description: description.trim(),
        type: gameType,
        createdBy: 'teacher',
        createdByName: '선생님',
        playCount: 0,
        isActive: true,
        createdAt: Timestamp.now(),
      };

      // 조건부 필드 추가 (undefined 방지)
      if (gameType === 'entry' || gameType === 'iframe') {
        gameData.gameUrl = gameUrl.trim();
      }

      if (gameType === 'p5js') {
        gameData.p5Code = p5Code.trim();
      }

      if (thumbnailUrl) {
        gameData.thumbnailUrl = thumbnailUrl;
      }

      await addDoc(collection(db, 'minigames'), gameData);

      alert('미니게임이 등록되었습니다!');
      router.push('/admin/minigames');
    } catch (error) {
      console.error('게임 등록 실패:', error);
      alert('게임 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎮 미니게임 등록</h1>
          <Link
            href="/admin/minigames"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            목록으로
          </Link>
        </div>
      </header>

      {/* 메인 */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 안내 */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> p5.js는 코드를 직접 입력하고, 엔트리는 공유 URL을 입력하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
            {/* 게임 타입 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                게임 타입 *
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setGameType('entry')}
                  className={`p-4 rounded-lg border-2 transition ${
                    gameType === 'entry'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🧩</div>
                  <div className="font-semibold">엔트리</div>
                  <div className="text-xs text-gray-600 mt-1">공유 URL</div>
                </button>

                <button
                  type="button"
                  onClick={() => setGameType('p5js')}
                  className={`p-4 rounded-lg border-2 transition ${
                    gameType === 'p5js'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">💻</div>
                  <div className="font-semibold">p5.js</div>
                  <div className="text-xs text-gray-600 mt-1">코드 입력</div>
                </button>

                <button
                  type="button"
                  onClick={() => setGameType('iframe')}
                  className={`p-4 rounded-lg border-2 transition ${
                    gameType === 'iframe'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🌐</div>
                  <div className="font-semibold">외부 링크</div>
                  <div className="text-xs text-gray-600 mt-1">iframe URL</div>
                </button>
              </div>
            </div>

            {/* 게임 제목 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                게임 제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 공 피하기 게임"
                required
              />
            </div>

            {/* 게임 설명 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                게임 설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="게임에 대한 간단한 설명..."
              />
            </div>

            {/* 엔트리 또는 iframe URL */}
            {(gameType === 'entry' || gameType === 'iframe') && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {gameType === 'entry' ? '엔트리 공유 URL' : '외부 게임 URL'} *
                </label>
                <input
                  type="url"
                  value={gameUrl}
                  onChange={(e) => setGameUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    gameType === 'entry'
                      ? 'https://playentry.org/project/...'
                      : 'https://example.com/game'
                  }
                  required
                />
                {gameType === 'entry' && (
                  <p className="text-xs text-gray-500 mt-1">
                    엔트리에서 작품 &gt; 공유하기 &gt; URL 복사
                  </p>
                )}
              </div>
            )}

            {/* p5.js 코드 */}
            {gameType === 'p5js' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    p5.js 코드 *
                  </label>
                  <button
                    type="button"
                    onClick={() => setP5Code(p5Template)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    템플릿 불러오기
                  </button>
                </div>
                <textarea
                  value={p5Code}
                  onChange={(e) => setP5Code(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={15}
                  placeholder={p5Template}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  setup()과 draw() 함수를 포함한 p5.js 코드를 입력하세요
                </p>
              </div>
            )}

            {/* 썸네일 업로드 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                썸네일 이미지 (선택)
              </label>
              <input
                type="file"
                ref={thumbnailInputRef}
                onChange={handleThumbnailChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                📁 파일 선택
              </button>
              {thumbnailPreview && (
                <div className="mt-3">
                  <img
                    src={thumbnailPreview}
                    alt="썸네일 미리보기"
                    className="w-48 h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/admin/minigames')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '🎮 게임 등록하기'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
