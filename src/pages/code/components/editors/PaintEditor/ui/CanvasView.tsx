/**
 * CanvasView - O viewport gráfico do Paint Editor.
 *
 * Responsabilidade: Atuar como o container real do elemento <canvas>,
 * gerenciar o redimensionamento dinâmico via ResizeObserver e implementar
 * os controles flutuantes de Zoom e Scrollbars. Coordena a sincronização
 * entre o Paper.js View e o layout do React.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';

import { DRAWING_CONFIG } from '../constants';
import { HiMagnifyingGlassMinus, HiMagnifyingGlassPlus, HiArrowsPointingOut } from 'react-icons/hi2';

/* ── Hook responsivo ── */
function useResponsiveSize() {
  // Valores padrão seguros para SSR
  const defaultSizes = React.useMemo(() => ({ icon: 18, pad: 'p-2' }), []);

  const calc = useCallback(() => {
    if (typeof window === 'undefined') return defaultSizes;
    const w = window.innerWidth;
    if (w < 900) return { icon: 14, pad: 'p-1' };
    if (w < 1200) return { icon: 16, pad: 'p-1.5' };
    return { icon: 18, pad: 'p-2' };
  }, [defaultSizes]);

  const [sizes, setSizes] = useState(defaultSizes);

  useEffect(() => {
    // Atualiza para o tamanho real após a montagem no cliente
    // Promise.resolve().then() evita o erro de 'setState síncrono dentro de effect'
    Promise.resolve().then(() => {
      const current = calc();
      setSizes((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(current)) return prev;
        return current;
      });
    });

    const onResize = () => setSizes(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [calc]);

  return sizes;
}

interface CanvasViewProps {
  scope: paper.PaperScope | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  scrollPos: { x: number; y: number };
  onScroll: (x: number, y: number) => void;
  textInput: { visible: boolean; x: number; y: number; value: string };
  setTextInputValue: (val: string) => void;
  onTextCommit: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  scope,
  canvasRef,
  scrollPos,
  onScroll,
  textInput,
  setTextInputValue,
  onTextCommit,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const s = useResponsiveSize();

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !scope || !scope.view) return;

    let resizeTimeout: NodeJS.Timeout;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        if (rect.width > 0 && rect.height > 0 && scope && scope.view && canvasRef.current) {
          // 1. O tamanho físico (em pixels na tela) do canvas
          const displayWidth = Math.floor(rect.width);
          const displayHeight = Math.floor(rect.height);

          // 2. Diz ao Paper.js qual é o tamanho LÓGICO.
          // O Paper.js lidará com o dpr (Device Pixel Ratio) nativamente.
          scope.view.viewSize = new scope.Size(displayWidth, displayHeight);

          // 3. Força a atualização do cache de offsets do Paper.js
          if (typeof (scope.view as unknown as { _updateElementOffset?: () => void })._updateElementOffset === 'function') {
            (scope.view as unknown as { _updateElementOffset: () => void })._updateElementOffset();
          }
          window.dispatchEvent(new Event('resize'));
          scope.view.update();

          // 4. Re-enquadra a imagem quando a tela for redimensionada (debounce)
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            onZoomToFit();
          }, 150);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current, { box: 'content-box' });
    }

    const onWindowResize = () => {
      if (scope && scope.view && typeof (scope.view as unknown as { _updateElementOffset?: () => void })._updateElementOffset === 'function') {
        (scope.view as unknown as { _updateElementOffset: () => void })._updateElementOffset();
      }
    };
    window.addEventListener('resize', onWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', onWindowResize);
      clearTimeout(resizeTimeout);
    };
  }, [scope, onZoomToFit, canvasRef]);

  return (
    <div ref={containerRef} className="flex-1 relative bg-slate-100 overflow-hidden group min-h-0 min-w-0">
      {/* Área de Desenho Isolada */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <canvas ref={canvasRef as any} className="absolute inset-0 w-full h-full block touch-none pointer-events-auto" />
      </div>

      {/* Zoom flutuante (canto inferior direito) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-2xl px-2 py-1.5 shadow-lg border border-slate-200/50 z-20">
        <button
          onClick={onZoomOut}
          className={`${s.pad} text-[#ccc] hover:text-indigo-500 rounded-xl transition-all hover:bg-indigo-50 hover:scale-110 active:scale-95`}
          title="Diminuir Zoom"
        >
          <HiMagnifyingGlassMinus size={s.icon} />
        </button>
        <button
          onClick={onZoomToFit}
          className={`${s.pad} text-[#ccc] hover:text-indigo-500 rounded-xl transition-all hover:bg-indigo-50 hover:scale-110 active:scale-95`}
          title="Encaixar"
        >
          <HiArrowsPointingOut size={s.icon} />
        </button>
        <button
          onClick={onZoomIn}
          className={`${s.pad} text-[#ccc] hover:text-indigo-500 rounded-xl transition-all hover:bg-indigo-50 hover:scale-110 active:scale-95`}
          title="Aumentar Zoom"
        >
          <HiMagnifyingGlassPlus size={s.icon} />
        </button>
      </div>

      {/* Scrollbars */}
      <div className="absolute right-1.5 top-4 bottom-16 w-2 bg-black/5 rounded-full opacity-40 group-hover:opacity-90 transition-opacity">
        <input
          type="range"
          min={-DRAWING_CONFIG.maxScroll}
          max={DRAWING_CONFIG.maxScroll}
          step="0.1"
          value={scrollPos.y}
          onChange={(e) => onScroll(scrollPos.x, parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
          style={{ writingMode: 'vertical-lr' as React.CSSProperties['writingMode'] }}
        />
        <div
          className="absolute w-full bg-indigo-400/60 rounded-full pointer-events-none"
          style={{
            height: '20%',
            top: `${((scrollPos.y + DRAWING_CONFIG.maxScroll) / (DRAWING_CONFIG.maxScroll * 2)) * 80}%`,
          }}
        />
      </div>
      <div className="absolute bottom-1.5 left-4 right-16 h-2 bg-black/5 rounded-full opacity-40 group-hover:opacity-90 transition-opacity">
        <input
          type="range"
          min={-DRAWING_CONFIG.maxScroll}
          max={DRAWING_CONFIG.maxScroll}
          step="0.1"
          value={scrollPos.x}
          onChange={(e) => onScroll(parseFloat(e.target.value), scrollPos.y)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        />
        <div
          className="absolute h-full bg-indigo-400/60 rounded-full pointer-events-none"
          style={{
            width: '20%',
            left: `${((scrollPos.x + DRAWING_CONFIG.maxScroll) / (DRAWING_CONFIG.maxScroll * 2)) * 80}%`,
          }}
        />
      </div>

      {/* Input de Texto Flutuante */}
      {textInput.visible && (
        <div className="absolute z-[100] min-w-[50px]" style={{ left: textInput.x, top: textInput.y }}>
          <input
            autoFocus
            value={textInput.value}
            onChange={(e) => setTextInputValue(e.target.value)}
            onBlur={onTextCommit}
            onKeyDown={(e) => e.key === 'Enter' && onTextCommit()}
            className="bg-transparent text-slate-800 border-b-2 border-indigo-500 outline-none p-1 font-sans text-xl"
            style={{ width: `${Math.max(50, textInput.value.length * 12)}px` }}
          />
        </div>
      )}
    </div>
  );
};
