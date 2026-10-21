/**
 * usePaperProject - Gestor do ciclo de vida e ambiente gráfico do Paper.js.
 *
 * Responsabilidade: Inicializar o PaperScope no canvas via layoutEffect,
 * criar a estrutura de camadas (Guides vs Drawing) e desenhar os componentes
 * de apoio visual, como a mesa cinza, o artboard branco e a grid de transparência.
 * Garante que cada montagem do editor comece com um estado gráfico limpo.
 */
import { useState, useLayoutEffect } from 'react';
import paperModule from 'paper';
import type * as paper from 'paper';
import { DRAWING_CONFIG } from '../constants';
import { IPaintItem } from '@/_base/domain/entities/IPaintEditor';

const PaperRuntime: typeof paper = (paperModule as any)?.PaperScope
  ? paperModule
  : (paperModule as any)?.default || (window as any).paper;

export function usePaperProject(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [scope, setScope] = useState<paper.PaperScope | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newScope = new PaperRuntime.PaperScope();
    newScope.setup(canvas);


    // O PaperJS gerencia o HiDPI (Retina) automaticamente através do view.viewSize
    // Se a tela estiver borrada, garantimos que o redimensionamento no CanvasView.tsx
    // esteja sincronizado com o tamanho real do elemento.

    // Cria Layers
    const guideLayer = new newScope.Layer({ name: 'guides' });
    const drawingLayer = new newScope.Layer({ name: 'drawing' });
    const uiLayer = new newScope.Layer({ name: 'ui' });

    // Desenha os limites da tela (Stage Artboard) na camada de guias
    guideLayer.activate();

    // 1. Limite Físico Total (A Mesa / Área ao redor do palco)
    const canvasW = DRAWING_CONFIG.canvas.w;
    const canvasH = DRAWING_CONFIG.canvas.h;
    const canvasRect = new newScope.Path.Rectangle({
      point: [0, 0],
      size: [canvasW, canvasH],
      fillColor: new newScope.Color('#d1d5db'), // Fundo da mesa: cinza um pouco mais escuro para contraste
    });
    canvasRect.locked = true;
    (canvasRect as IPaintItem).guide = true;

    // 2. Limites Visuais do Palco (Artboard 480x360)
    const stageW = DRAWING_CONFIG.artboard.w;
    const stageH = DRAWING_CONFIG.artboard.h;
    const stagePoint = new newScope.Point(DRAWING_CONFIG.abX, DRAWING_CONFIG.abY);

    // Fundo Branco do Palco (para não ver o cinza da mesa atrás do xadrez)
    const stageBackground = new newScope.Path.Rectangle({
      point: stagePoint,
      size: [stageW, stageH],
      fillColor: new newScope.Color('white'),
    });
    stageBackground.locked = true;
    (stageBackground as IPaintItem).guide = true;

    const boundsRect = new newScope.Path.Rectangle({
      point: stagePoint,
      size: [stageW, stageH],
      fillColor: null,
      strokeColor: new newScope.Color('#94a3b8'), // slate-400
      strokeWidth: 1,
      dashArray: [4, 4],
    });
    (boundsRect as IPaintItem).guide = true;

    // 3. Mira Central (Crosshair) para ajudar no alinhamento 0,0
    const centerX = DRAWING_CONFIG.abX + stageW / 2;
    const centerY = DRAWING_CONFIG.abY + stageH / 2;
    const crossSize = 10;
    const chH = new newScope.Path.Line([centerX - crossSize, centerY], [centerX + crossSize, centerY]);
    const chV = new newScope.Path.Line([centerX, centerY - crossSize], [centerX, centerY + crossSize]);
    const crosshair = new newScope.Group([chH, chV]);
    crosshair.strokeColor = new newScope.Color('#94a3b8');
    crosshair.strokeWidth = 1;
    crosshair.locked = true;
    (crosshair as unknown as IPaintItem).guide = true;

    // ==========================================
    // Padrão Xadrez (Checkerboard) via SVG <pattern> — 1 único Raster
    // ==========================================
    // Um único SVG com <pattern> cobre todo o artboard sem gerar centenas de clones,
    // eliminando problemas de hit-test e queda de performance.
    const checkerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${stageW}" height="${stageH}"><defs><pattern id="cb" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#e2e8f0"/><rect x="8" y="8" width="8" height="8" fill="#e2e8f0"/></pattern></defs><rect width="${stageW}" height="${stageH}" fill="url(#cb)"/></svg>`;
    const checkerDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(checkerSvg);

    let disposed = false;
    const checkerRaster = new newScope.Raster(checkerDataUrl);
    checkerRaster.on('load', () => {
      if (disposed) {
        checkerRaster.remove();
        return;
      }
      checkerRaster.position = new newScope.Point(stagePoint.x + stageW / 2, stagePoint.y + stageH / 2);
      checkerRaster.locked = true;
      (checkerRaster as unknown as IPaintItem).guide = true;
      const gl = newScope.project.layers.find((l) => l.name === 'guides');
      if (gl) {
        gl.addChild(checkerRaster);
        checkerRaster.sendToBack();
        canvasRect.sendToBack();
      }
    });

    drawingLayer.activate();

    // 4. Marcador de Limites (Artboard) na camada de desenho
    // Este retângulo é invisível mas essencial para que o SvgService saiba
    // a posição real do artboard ao exportar/importar, mantendo a escala e centralização.
    const pbtBounds = new newScope.Path.Rectangle({
      point: stagePoint,
      size: [stageW, stageH],
      fillColor: null,
      strokeColor: null,
      name: 'PBT_BOUNDS_BOX',
    });
    (pbtBounds as IPaintItem).guide = true;
    pbtBounds.visible = false;

    setScope(newScope);

    return () => {
      disposed = true;
      newScope.project?.clear();
      newScope.project?.remove();
    };
  }, [canvasRef]);

  return scope;
}
