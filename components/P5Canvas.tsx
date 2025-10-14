'use client';

import { useEffect, useRef } from 'react';

interface P5CanvasProps {
  code: string;
  width?: number;
  height?: number;
}

export default function P5Canvas({ code, width = 800, height = 600 }: P5CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 기존 스크립트 정리
    if (scriptRef.current) {
      scriptRef.current.remove();
    }

    // 기존 캔버스 정리
    const existingCanvas = containerRef.current.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    // p5.js 라이브러리 로드 (CDN 사용)
    const loadP5 = () => {
      return new Promise<void>((resolve, reject) => {
        if (typeof (window as Window & { p5?: unknown }).p5 !== 'undefined') {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    // p5.js 코드 실행
    const runP5Code = async () => {
      try {
        await loadP5();

        // 사용자 코드를 감싸는 wrapper 생성
        const wrappedCode = `
          (function() {
            ${code}

            // p5 인스턴스 모드로 실행
            new p5((p) => {
              ${code.includes('p.') ? '' : `
                const originalSetup = typeof setup !== 'undefined' ? setup : null;
                const originalDraw = typeof draw !== 'undefined' ? draw : null;

                p.setup = function() {
                  if (originalSetup) originalSetup.call(p);
                };

                p.draw = function() {
                  if (originalDraw) originalDraw.call(p);
                };
              `}
            }, document.getElementById('p5-container'));
          })();
        `;

        const script = document.createElement('script');
        script.textContent = wrappedCode;
        scriptRef.current = script;

        if (containerRef.current) {
          containerRef.current.appendChild(script);
        }
      } catch (error) {
        console.error('p5.js 실행 실패:', error);
      }
    };

    runP5Code();

    return () => {
      // 정리
      if (scriptRef.current) {
        scriptRef.current.remove();
      }

      // p5 인스턴스 제거 - containerRef.current를 변수에 저장
      const container = containerRef.current;
      if (container) {
        const canvas = container.querySelector('canvas');
        if (canvas) {
          canvas.remove();
        }
      }
    };
  }, [code, width, height]);

  return (
    <div
      id="p5-container"
      ref={containerRef}
      className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
