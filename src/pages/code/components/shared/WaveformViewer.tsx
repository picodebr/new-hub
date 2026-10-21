/**
 * WaveformViewer - Renderizador de forma de onda baseado em SVG com seleção de região.
 *
 * Arrastar na forma de onda cria uma seleção (start/end como fração 0-1).
 * Arrastar nas alças redimensiona a seleção.
 * Clicar em área vazia fora da seleção limpa a seleção.
 */
'use client';

import { useMemo, useRef, useCallback } from 'react';

// Resolução interna do SVG (número de amostras). Independente do tamanho de exibição.
const SAMPLE_RESOLUTION = 800;

// Zona de detecção das alças em pixels
const HANDLE_PX = 14;

export interface WaveSelection {
    start: number; // 0–1
    end: number;   // 0–1
}

interface WaveformViewerProps {
    buffer: AudioBuffer | null;
    height?: number;
    playhead?: number | null;
    color?: string;
    className?: string;
    /** @deprecated sem efeito — componente é fluido */
    width?: number;
    selection?: WaveSelection | null;
    onSelectionChange?: (sel: WaveSelection | null) => void;
}

export default function WaveformViewer({
    buffer,
    height = 160,
    playhead = null,
    color = '#4C97FF',
    className = '',
    selection = null,
    onSelectionChange,
}: WaveformViewerProps) {

    const containerRef = useRef<HTMLDivElement>(null);
    // type: 'new' = criando seleção | 'start' = arrastando alça esquerda | 'end' = arrastando alça direita
    const dragRef = useRef<{ type: 'new' | 'start' | 'end'; anchor: number } | null>(null);

    const getFraction = useCallback((clientX: number): number => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return 0;
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!onSelectionChange || !buffer) return;
        e.preventDefault();

        const frac = getFraction(e.clientX);
        const rect = containerRef.current?.getBoundingClientRect();
        const containerWidth = rect?.width ?? 1;
        const threshold = HANDLE_PX / containerWidth;

        let type: 'new' | 'start' | 'end' = 'new';
        if (selection) {
            if (Math.abs(frac - selection.start) < threshold) {
                type = 'start';
            } else if (Math.abs(frac - selection.end) < threshold) {
                type = 'end';
            }
        }

        if (type === 'new') {
            onSelectionChange({ start: frac, end: frac });
        }
        dragRef.current = { type, anchor: frac };

        // Captura do estado da seleção atual para os handlers de arrastar
        const selAtDown = selection ? { ...selection } : { start: frac, end: frac };

        const onMove = (ev: MouseEvent) => {
            const f = getFraction(ev.clientX);
            const d = dragRef.current;
            if (!d) return;

            if (d.type === 'new') {
                onSelectionChange({
                    start: Math.min(d.anchor, f),
                    end: Math.max(d.anchor, f),
                });
            } else if (d.type === 'start') {
                onSelectionChange({
                    start: Math.max(0, Math.min(f, selAtDown.end - 0.005)),
                    end: selAtDown.end,
                });
            } else if (d.type === 'end') {
                onSelectionChange({
                    start: selAtDown.start,
                    end: Math.min(1, Math.max(f, selAtDown.start + 0.005)),
                });
            }
        };

        const onUp = (ev: MouseEvent) => {
            const f = getFraction(ev.clientX);
            const d = dragRef.current;
            // Se foi um clique sem arrastar (seleção vazia) fora de seleção existente → limpa
            if (d?.type === 'new' && Math.abs(f - d.anchor) < threshold) {
                onSelectionChange(null);
            }
            dragRef.current = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [buffer, getFraction, onSelectionChange, selection]);

    const pathData = useMemo(() => {
        if (!buffer) return '';
        const data = buffer.getChannelData(0);
        const samples = SAMPLE_RESOLUTION;
        const blockSize = Math.max(1, Math.floor(data.length / samples));
        const mid = height / 2;

        let upperPoints = '';
        let lowerPoints = '';

        for (let i = 0; i < samples; i++) {
            let max = 0;
            for (let j = 0; j < blockSize; j++) {
                const val = Math.abs(data[(i * blockSize) + j] ?? 0);
                if (val > max) max = val;
            }
            const amplitude = Math.min(max * mid * 0.9, mid);
            upperPoints += `${i === 0 ? 'M' : 'L'} ${i} ${mid - amplitude} `;
            lowerPoints = `L ${i} ${mid + amplitude} ` + lowerPoints;
        }

        return upperPoints + lowerPoints + 'Z';
    }, [buffer, height]);

    if (!buffer) {
        return (
            <div
                className={`w-full flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg ${className}`}
                style={{ height }}
            >
                <span className="text-slate-400 text-sm">Carregando áudio...</span>
            </div>
        );
    }

    // Seleção em % para o CSS
    const selLeft   = selection ? `${selection.start * 100}%` : '0%';
    const selRight  = selection ? `${(1 - selection.end) * 100}%` : '100%';
    const hasSelection = selection && (selection.end - selection.start) > 0.002;

    return (
        <div
            ref={containerRef}
            className={`relative w-full overflow-hidden ${className}`}
            style={{ height, cursor: onSelectionChange ? 'crosshair' : 'default', userSelect: 'none' }}
            onMouseDown={handleMouseDown}
        >
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="h-[1px] w-full bg-slate-400"></div>
                <div className="h-[1px] w-full bg-slate-400"></div>
                <div className="h-[1px] w-full bg-slate-400"></div>
            </div>

            {/* Forma de onda */}
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${SAMPLE_RESOLUTION} ${height}`}
                preserveAspectRatio="none"
                className="drop-shadow-sm pointer-events-none"
            >
                <path
                    d={pathData}
                    fill={color}
                    fillOpacity={0.4}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                />
            </svg>

            {/* Overlay de seleção */}
            {hasSelection && (
                <>
                    {/* Fundo escurecido fora da seleção */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.18)' }} />

                    {/* Retângulo de seleção */}
                    <div
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{
                            left: selLeft,
                            right: selRight,
                            background: 'rgba(76,151,255,0.22)',
                            borderLeft: '2px solid rgba(76,151,255,0.8)',
                            borderRight: '2px solid rgba(76,151,255,0.8)',
                        }}
                    />

                    {/* Alça esquerda — topo */}
                    <div className="absolute pointer-events-auto" style={{ left: `calc(${selLeft} - 7px)`, top: -7, cursor: 'ew-resize' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4c97ff', border: '2.5px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                    </div>
                    {/* Alça esquerda — base */}
                    <div className="absolute pointer-events-auto" style={{ left: `calc(${selLeft} - 7px)`, bottom: -7, cursor: 'ew-resize' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4c97ff', border: '2.5px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                    </div>
                    {/* Alça direita — topo */}
                    <div className="absolute pointer-events-auto" style={{ left: `calc(${selection!.end * 100}% - 7px)`, top: -7, cursor: 'ew-resize' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4c97ff', border: '2.5px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                    </div>
                    {/* Alça direita — base */}
                    <div className="absolute pointer-events-auto" style={{ left: `calc(${selection!.end * 100}% - 7px)`, bottom: -7, cursor: 'ew-resize' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4c97ff', border: '2.5px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                    </div>
                </>
            )}

            {/* Playhead */}
            {playhead !== null && (
                <div
                    className="absolute top-0 bottom-0 w-[2px] bg-[#ff4d4d] z-10 pointer-events-none"
                    style={{ left: `${playhead * 100}%`, boxShadow: '0 0 8px rgba(255,77,77,0.5)' }}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#ff4d4d] rounded-full"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#ff4d4d] rounded-full"></div>
                </div>
            )}
        </div>
    );
}
