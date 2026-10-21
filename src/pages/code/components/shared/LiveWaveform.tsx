/**
 * LiveWaveform - Visualizador de amplitude em tempo real (Osciloscópio).
 */
'use client';

import React, { useRef, useEffect } from 'react';

// Resolução interna do canvas para desenho — independente do tamanho de exibição
const CANVAS_WIDTH = 800;

interface LiveWaveformProps {
    data: Uint8Array | null;
    height?: number;
    color?: string;
    /** @deprecated não tem efeito — componente é fluido */
    width?: number;
}

export default function LiveWaveform({
    data,
    height = 100,
    color = '#4C97FF'
}: LiveWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = CANVAS_WIDTH;
        // Limpar canvas
        ctx.clearRect(0, 0, width, height);
        
        // Configurar estilo
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Linha central
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        const sliceWidth = width / data.length;
        let x = 0;

        for (let i = 0; i < data.length; i++) {
            const v = data[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Adicionar um brilho suave (glow)
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;

    }, [data, height, color]);

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={height}
            className="w-full h-full opacity-90 transition-opacity duration-300"
        />
    );
}
