/**
 * useZoom - Hook para controle de zoom e navegação (scroll/pan) no Editor de Pintura.
 *
 * Responsabilidade: Gerenciar o nível de ampliação do canvas e o posicionamento
 * da visualização. Implementa lógica de interpolação para zoom suave e funções
 * de conveniência como "Ajustar à Tela".
 *
 * Operações Principais:
 * - Controle imperativo do zoom e centro da `View` do Paper.js.
 * - Implementação de scroll limitado para manter o conteúdo visível.
 * - Animação de zoom e pan usando `requestAnimationFrame` para fluidez.
 * - Cálculo de zoom automático para enquadrar o conteúdo atual (`zoomToFit`).
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type * as paper from 'paper';

import { DRAWING_CONFIG } from '../constants';

function lerp(start: number, end: number, amt: number) {
    return (1 - amt) * start + amt * end;
}

/**
 * Funções utilitárias para realizar mutações imperativas na View do Paper.js.
 * Isso ajuda a evitar avisos do React Compiler sobre modificação de argumentos.
 */
const updateViewZoom = (view: paper.View, zoom: number) => {
    view.zoom = zoom;
};

const updateViewCenter = (view: paper.View, center: paper.Point) => {
    view.center = center;
};

export function useZoom(scope: paper.PaperScope | null) {
    const [zoom, setZoom] = useState(1);
    const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
    const animRef = useRef<number | null>(null);

    const cancelAnim = useCallback(() => {
        if (animRef.current) {
            cancelAnimationFrame(animRef.current);
            animRef.current = null;
        }
    }, []);

    const updateScroll = useCallback((x: number, y: number) => {
        if (!scope || !scope.view) return;

        // Limita o scroll para não fugir do palco
        const limitedX = Math.max(-DRAWING_CONFIG.maxScroll, Math.min(DRAWING_CONFIG.maxScroll, x));
        const limitedY = Math.max(-DRAWING_CONFIG.maxScroll, Math.min(DRAWING_CONFIG.maxScroll, y));

        setScrollPos({ x: limitedX, y: limitedY });

        const centerX = DRAWING_CONFIG.canvas.w / 2;
        const centerY = DRAWING_CONFIG.canvas.h / 2;

        const scrollX = (limitedX * 120) / scope.view.zoom;
        const scrollY = (limitedY * 120) / scope.view.zoom;

        const view = scope.view;
        updateViewCenter(view, new scope.Point(centerX + scrollX, centerY + scrollY));
        view.update();
    }, [scope]);

    const zoomTo = useCallback((newZoom: number) => {
        cancelAnim();
        if (!scope || !scope.view) return;
        
        // Aplica limites de zoom e persiste no estado
        const actualZoom = Math.max(DRAWING_CONFIG.minZoom, Math.min(DRAWING_CONFIG.maxZoom, newZoom));
        
        const view = scope.view;
        setZoom(actualZoom);
        updateViewZoom(view, actualZoom);
    }, [scope, cancelAnim]);

    const animateTo = useCallback((targetZoom: number, targetX: number, targetY: number) => {
        if (!scope || !scope.view) return;
        cancelAnim();

        const startZoom = scope.view.zoom;
        const startCenterX = scope.view.center.x;
        const startCenterY = scope.view.center.y;

        const centerX = DRAWING_CONFIG.canvas.w / 2;
        const centerY = DRAWING_CONFIG.canvas.h / 2;
        const endCenterX = centerX + (targetX * 120) / targetZoom;
        const endCenterY = centerY + (targetY * 120) / targetZoom;

        // Atualiza a UI imediatamente para sensação de resposta instantânea
        setZoom(targetZoom);
        setScrollPos({ x: targetX, y: targetY });

        let progress = 0;
        const duration = 20; // Aproximadamente 300ms a 60fps (suave)

        const step = () => {
            progress += 1;
            const amt = Math.min(progress / duration, 1);
            // Ease-out Cubic para uma frenagem suave e responsiva ao invés de linear
            const easeAmt = 1 - Math.pow(1 - amt, 3);

            const view = scope.view;
            updateViewZoom(view, lerp(startZoom, targetZoom, easeAmt));
            updateViewCenter(view, new scope.Point(
                lerp(startCenterX, endCenterX, easeAmt),
                lerp(startCenterY, endCenterY, easeAmt)
            ));

            if (progress < duration) {
                animRef.current = requestAnimationFrame(step);
            } else {
                animRef.current = null;
            }
        };

        animRef.current = requestAnimationFrame(step);
    }, [scope, cancelAnim]);

    const zoomToFit = useCallback(() => {
        if (!scope || !scope.view) return;
        const dl = scope.project.layers.find(l => l.name === 'drawing') || scope.project.activeLayer;

        const targetW = DRAWING_CONFIG.artboard.w;
        const targetH = DRAWING_CONFIG.artboard.h;

        const padding = 100;
        const scaleX = (scope.view.viewSize.width - padding) / targetW;
        const scaleY = (scope.view.viewSize.height - padding) / targetH;

        let targetZoom = Math.min(scaleX, scaleY, 1.0);
        // Limitado em 1.0 se estiver vazio

        if (dl.children.length === 0) {
            animateTo(targetZoom, 0, 0);
            return;
        }

        // Se tem conteúdo, permitimos zoom maior (até 3x) se necessário para caber
        targetZoom = Math.min(scaleX, scaleY, 3);

        const bounds = dl.bounds;
        if (bounds.width > targetW || bounds.height > targetH) {
            const fitScaleX = (scope.view.viewSize.width - padding) / bounds.width;
            const fitScaleY = (scope.view.viewSize.height - padding) / bounds.height;
            targetZoom = Math.min(fitScaleX, fitScaleY, targetZoom);
        }

        // Forçamos targetX e targetY em 0 para garantir que o centro da View 
        // aponte para o centro do Canvas (512, 300), que é onde o palco está fixo.
        animateTo(targetZoom, 0, 0);
    }, [scope, animateTo]);

    // Limpa a animação caso o componente desmonte para evitar memory leak
    useEffect(() => {
        return () => cancelAnim();
    }, [cancelAnim]);

    return { zoom, setZoom: zoomTo, scrollPos, updateScroll, zoomToFit };
}
