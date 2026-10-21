'use client';

/**
 * PaintEditor - O coração visual do PicoCode Hub para criação de Atores e Cenários.
 *
 * Responsabilidade: Orquestrar a ponte entre o ecossistema React (Estado/Contexto)
 * e o motor vetorial Paper.js (Canvas). Gerencia o ciclo de vida do projeto de desenho,
 * sincronização em tempo real com o palco e a persistência de histórico (Undo/Redo).
 *
 * Estratégia de Sincronização (Live Sync):
 * Gera um par de SVGs:
 * 1. Thumbnail: Cortado rente aos limites do desenho (gera o ícone na sidebar).
 * 2. Stage: Mantém o artboard 480x360 (garante posição absoluta correta no palco).
 *
 * Fluxo de Dados:
 * 1. Mudança no Paper.js -> useTools dispara mudança.
 * 2. syncToContext (Throttled @ 10fps) exporta via SvgService.
 * 3. Update no ProjectContext propaga o base64 para o StageRunner.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type * as paper from 'paper';
import { DRAWING_CONFIG } from './constants';

const MAX_BITMAP_W = 960;
const MAX_BITMAP_H = 720;

// Regra de resize do Scratch (BitmapAdapter): máximo 960×720, preservando aspect ratio.
// Imagens menores que 480×360 são dobradas para manter nitidez (bitmapResolution=2).
function clampToBitmapBounds(srcW: number, srcH: number): { w: number; h: number } {
  if (srcW <= MAX_BITMAP_W && srcH <= MAX_BITMAP_H) return { w: srcW, h: srcH };
  const scale = Math.min(MAX_BITMAP_W / srcW, MAX_BITMAP_H / srcH);
  return { w: Math.max(1, Math.floor(srcW * scale)), h: Math.max(1, Math.floor(srcH * scale)) };
}
import { SvgService } from './core/SvgService';
import { normalizeSvgString, decodeSvgUrl, detectFormat } from './services/svgRenderer';

// UI
import { Header } from './ui/Header';
import { Toolbar } from './ui/Toolbar';
import { CanvasView } from './ui/CanvasView';

// Hooks
import { usePaperProject } from './hooks/usePaperProject';
import { useHistory } from './hooks/useHistory';
import { useTools } from './hooks/useTools';
import { useZoom } from './hooks/useZoom';
import { useProject } from '@/_base/context/ProjectContext';
import { IPaintItem } from '@/_base/domain/entities/IPaintEditor';

interface PaintEditorProps {
  spriteId: string;
  costumeId: string;
  costumeName: string;
  initialUrl?: string;
  isBackdrop?: boolean;
}

export const PaintEditor: React.FC<PaintEditorProps> = ({ spriteId, costumeId, costumeName, initialUrl, isBackdrop }) => {
  const { updateCostume } = useProject();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State
  const [state, setState] = useState({
    fillColor: '#4483ff',
    strokeColor: '#000000',
    strokeWidth: 1,
    brushSize: 20,
    fillTransparent: false,
    strokeTransparent: false,
    fontFamily: 'Arial',
    fontSize: 24,
  });

  const [textInput, setTextInput] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: '',
    point: null as paper.Point | null,
  });

  // Paper.js setup
  const scope = usePaperProject(canvasRef);
  const svgService = useMemo(() => (scope ? new SvgService(scope) : null), [scope]);

  // Stable refs for context sync (prevents re-render cascades)
  const spriteIdRef = useRef(spriteId);
  const costumeIdRef = useRef(costumeId);
  
  // Se não for passado explicitamente, inferimos que é um cenário se spriteId for 'stage'
  const isBackdropEffective = isBackdrop ?? (spriteId === 'stage');
  const isBackdropRef = useRef(isBackdropEffective);

  spriteIdRef.current = spriteId;
  costumeIdRef.current = costumeId;
  isBackdropRef.current = isBackdropEffective;

  const updateCostumeRef = useRef(updateCostume);
  useEffect(() => {
    updateCostumeRef.current = updateCostume;
  }, [updateCostume]);

  const costumeNameRef = useRef(costumeName);
  useEffect(() => {
    costumeNameRef.current = costumeName;
  }, [costumeName]);

  // Track last synced offset to avoid infinite delta loops
  const lastOffsetRef = useRef({ x: 0, y: 0 });



  // Stable syncToContext that never changes identity
  // SINCRONIZAÇÃO COM O PALCO (LIVE SYNC):
  // Esta função converte o estado atual do canvas vetorial em um par de SVGs:
  // - thumbnailSvg: Cortado para os limites do desenho (gera o ícone da galeria).
  // - stageSvg: Mantém o artboard 480x360 (garante posição correta no palco).
  const syncToContext = useCallback(() => {
    if (!svgService || !scope) return;

    const dl = scope.project?.layers?.find((l) => l.name === 'drawing') || scope.project?.activeLayer;

    // Gera PNG thumbnail para fantasias raster (usado como `url` e `stageUrl` pelo palco)
    let pngThumbnailUrl: string | null = null;

    if (dl) {
      const realItems = dl.children.filter((i) =>
        i.visible && !i.locked && !(i as any).guide &&
        i.name !== 'PBT_BOUNDS_BOX' && i.name !== 'SCRATCH_BBOX_HACK'
      );

      // Guard: canvas vazio durante transição — não exportar SVG em branco
      if (realItems.length === 0) return;

      if (realItems.length === 1 && realItems[0] instanceof scope.Raster) {
        const raster = realItems[0] as paper.Raster;
        // Guard: raster ainda não carregou
        if (raster.width === 0 || raster.height === 0) return;

        // Gera PNG a partir do canvas do raster. Os `return` foram removidos do try block
        // para não abortar a sincronização completa quando apenas a geração do thumbnail falha.
        try {
          const imgEl = raster.image as HTMLCanvasElement | HTMLImageElement | null;
          if (imgEl) {
            const displayW = Math.max(2, Math.round(raster.bounds.width));
            const displayH = Math.max(2, Math.round(raster.bounds.height));
            if (displayW > 1 || displayH > 1) {
              const offscreen = document.createElement('canvas');
              offscreen.width = displayW;
              offscreen.height = displayH;
              const ctx = offscreen.getContext('2d');
              if (ctx) {
                ctx.drawImage(imgEl as CanvasImageSource, 0, 0, displayW, displayH);
                const candidate = offscreen.toDataURL('image/png');
                if (candidate && candidate !== 'data:,') pngThumbnailUrl = candidate;
              }
            }
          }
        } catch (_) { /* fallthrough */ }
      }
    }

    // Exporta SVG para stageUrl e thumbnailUrl
    const { thumbnailSvg, stageSvg } = svgService.exportDrawingSVG({ isBackdrop: isBackdropRef.current });
    if (!thumbnailSvg || !stageSvg) return;

    const encode = (s: string) => btoa(new TextEncoder().encode(s).reduce((a, b) => a + String.fromCharCode(b), ''));
    const thumbnailSvgUrl = `data:image/svg+xml;base64,${encode(thumbnailSvg)}`;

    // Para rasters: stageUrl = pngThumbnailUrl (PNG direto).
    //   Usar o PNG diretamente evita o loop de reload: lastSyncedUrlRef = stageUrl = pngThumbnailUrl
    //   = costume.url = initialUrl → isRecentlySynced=true → load effect não recarrega o canvas.
    //   O palco carrega o PNG normalmente (não precisa de loadSvgHighRes), e o tamanho real
    //   (logicalW/H) é extraído das dimensões naturais do PNG.
    // Para vetores: stageUrl = stageSvg (artboard completo, necessário para o paint editor
    //   recarregar com posicionamento correto via PBT_BOUNDS_BOX).
    const stageUrl = pngThumbnailUrl
      ? pngThumbnailUrl  // raster: PNG direto → palco usa tamanho real do conteúdo
      : `data:image/svg+xml;base64,${encode(stageSvg)}`; // vetor: artboard completo

    // thumbUrl: PNG para rasters (paint editor recarrega centrado), SVG thumbnail para vetores
    const thumbUrl = pngThumbnailUrl ?? thumbnailSvgUrl;

    lastSyncedUrlRef.current = stageUrl;
    updateCostumeRef.current(spriteIdRef.current, costumeIdRef.current, thumbUrl, stageUrl);
  }, [scope]);

  // Undo/Redo
  const { saveHistory, setInitialState, undo, redo, canUndo, canRedo } = useHistory(scope, syncToContext);

  const onShowTextInput = useCallback(
    (point: paper.Point) => {
      const view = scope?.view;
      if (view) {
        const viewPos = view.projectToView(point);
        setTextInput({ visible: true, x: viewPos.x, y: viewPos.y, value: '', point });
      }
    },
    [scope],
  );

  // Tools
  const { activeToolId, activateTool, commitText, notifyProjectChange, clearSelectionForCostumeSwitch } = useTools(
    scope,
    state,
    saveHistory,
    onShowTextInput
  );

  // Zoom & Scroll
  const { zoom, setZoom, scrollPos, updateScroll, zoomToFit } = useZoom(scope);

  // Stable ref for activateTool — its identity changes on every tool switch, so we
  // use a ref to call it from the costume-switch effect without adding it to deps
  const activateToolRef = useRef(activateTool);
  useEffect(() => { activateToolRef.current = activateTool; }, [activateTool]);

  // Per-costume zoom persistence
  const savedZoomMapRef = useRef<Map<string, number>>(new Map());
  const zoomRef = useRef(zoom);
  const setZoomRef = useRef(setZoom);
  // Ref to the "zoom after load" function — updated before each load so that
  // importSvgString (a stable useCallback) can always call the fresh version
  const zoomAfterLoadRef = useRef<() => void>(() => zoomToFit());
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { setZoomRef.current = setZoom; }, [setZoom]);

  // Reset tool to Select and camera on costume switch
  useEffect(() => {
    lastOffsetRef.current = { x: 0, y: 0 };
    activateToolRef.current('select');
    if (scope && scope.view) {
      zoomToFit();
    }
  }, [spriteId, costumeId, scope, zoomToFit]);

  // Helper: import SVG string into the project
  const importSvgString = useCallback(
    (svgString: string, isInitial: boolean = false, hasPicoMarker: boolean = false, loadId?: number) => {
      // Segurança: Verifica se o motor gráfico (scope) e o projeto estão ativos
      if (!scope || !scope.project || !svgService) return;

      // LIMPEZA PREVENTIVA: Antes de importar qualquer coisa, limpamos a camada de desenho
      // para evitar duplicidade de itens (Race Condition ao clicar rápido no bloco)
      const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
      dl.removeChildren();

      const normalized = normalizeSvgString(svgString, hasPicoMarker);
      scope.activate();
      scope.project.importSVG(normalized, {
        insert: true,
        onLoad: (importedItem: paper.Item | null) => {
          if (loadId !== undefined && loadId !== currentLoadIdRef.current) {
            importedItem?.remove();
            return;
          }

          if (!importedItem || !scope.project) {
            console.warn('[PaintEditor] Importação abortada: Item nulo ou projeto destruído.');
            return;
          }

          const bbox = importedItem.getItem({ name: 'PBT_BOUNDS_BOX', recursive: true });
          const scaleFactor = isBackdropEffective ? 1.0 : 0.8;
          const stageCenter = new scope.Point(DRAWING_CONFIG.canvas.w / 2, DRAWING_CONFIG.canvas.h / 2);

          if (!bbox) {
            if (hasPicoMarker) {
              // SVG gerado por este editor mas sem PBT_BOUNDS_BOX (editado manualmente antes
              // do marcador existir). Usa translate em vez de bounds.topLeft= para compatibilidade
              // com todos os tipos de item do Paper.js (grupos, compound paths, rasters...).
              const artboardTopLeft = new scope.Point(DRAWING_CONFIG.abX, DRAWING_CONFIG.abY);
              const delta = artboardTopLeft.subtract(importedItem.bounds.topLeft);
              importedItem.translate(delta);
            } else {
              importedItem.position = stageCenter;
              const ib = importedItem.bounds;
              const maxW = DRAWING_CONFIG.artboard.w * scaleFactor;
              const maxH = DRAWING_CONFIG.artboard.h * scaleFactor;
              if (ib.width > maxW || ib.height > maxH || (isInitial && isBackdropEffective)) {
                const scale = Math.min(maxW / ib.width, maxH / ib.height);
                importedItem.scale(scale);
              }
            }
          } else {
            const expectedTopLeft = new scope.Point(DRAWING_CONFIG.abX, DRAWING_CONFIG.abY);
            const delta = expectedTopLeft.subtract(bbox.bounds.topLeft);
            importedItem.translate(delta);
            (bbox as IPaintItem).guide = true;
            bbox.visible = false;
          }

          svgService.releaseSVG(importedItem);

          if (isInitial) {
            setInitialState();
            requestAnimationFrame(() => syncToContext());
          } else {
            saveHistory();
            notifyProjectChange();
          }

          setTimeout(() => zoomAfterLoadRef.current(), 50);
        },
      });
    },
    [scope, isBackdrop, svgService, saveHistory, setInitialState, notifyProjectChange, syncToContext],
  );

  // Initial Load - handles both base64 and URL
  // Uses costumeId AND initialUrl as the key: reloads when the active costume changes
  // OR when the URL changes (e.g. new file uploaded for same costume).
  const loadedCostumeIdRef = useRef<string | null>(null);
  const loadedUrlRef = useRef<string | null>(null);
  const lastSyncedUrlRef = useRef<string | null>(null);
  // Monotonic counter — each new load increments it; stale async callbacks compare before acting
  const currentLoadIdRef = useRef(0);

  useEffect(() => {
    if (!scope || !initialUrl) return;

    const isRecentlySynced = lastSyncedUrlRef.current === initialUrl;
    const isSameUrl = loadedUrlRef.current === initialUrl;

    if (loadedCostumeIdRef.current === costumeId && (isSameUrl || isRecentlySynced)) {
      return;
    }

    // Save zoom for the costume being left before loading the next one
    if (loadedCostumeIdRef.current && loadedCostumeIdRef.current !== costumeId) {
      savedZoomMapRef.current.set(`${spriteId}:${loadedCostumeIdRef.current}`, zoomRef.current);
    }

    loadedCostumeIdRef.current = costumeId;
    loadedUrlRef.current = initialUrl;

    // Set up zoom restore-or-fit for this costume load
    const zoomKey = `${spriteId}:${costumeId}`;
    zoomAfterLoadRef.current = () => {
      const saved = savedZoomMapRef.current.get(zoomKey);
      if (saved !== undefined) {
        setZoomRef.current(saved);
      } else {
        zoomToFit();
      }
    };

    // Invalidate any in-flight load from a previous costume switch
    const loadId = ++currentLoadIdRef.current;

    // CORS fix: para URLs HTTP, o crossOrigin PRECISA estar definido ANTES do src.
    // Se setarmos depois, o browser já iniciou o request sem o header Origin → canvas fica tainted
    // → Paper.js não consegue exportar o SVG com a imagem embedded → stageUrl nunca é definido.
    // Solução: pré-carregamos a imagem manualmente com crossOrigin correto, desenhamos
    // num canvas limpo e criamos o Raster a partir desse canvas (sempre não-tainted).
    const loadRasterSafely = (
      url: string,
      onLoaded: (raster: paper.Raster) => void,
      onFailed: () => void,
    ) => {
      scope.activate();
      if (url.startsWith('http') || url.startsWith('//')) {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // definido ANTES de src
        img.onload = () => {
          if (loadId !== currentLoadIdRef.current) return;
          const { w, h } = clampToBitmapBounds(img.naturalWidth, img.naturalHeight);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx || !scope.project) { onFailed(); return; }
          // Usa smoothing apenas ao reduzir; nearest-neighbor ao manter ou ampliar
          ctx.imageSmoothingEnabled = w < img.naturalWidth || h < img.naturalHeight;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          scope.activate();
          const raster = new scope.Raster(canvas);
          onLoaded(raster);
        };
        img.onerror = () => {
          if (loadId !== currentLoadIdRef.current) return;
          onFailed();
        };
        img.src = url; // src definido DEPOIS de crossOrigin
      } else {
        // data URI ou URL local — sem problema de CORS
        const raster = new scope.Raster(url);
        raster.onLoad = () => {
          if (loadId !== currentLoadIdRef.current) { raster.remove(); return; }
          onLoaded(raster);
        };
        raster.onError = () => {
          if (loadId !== currentLoadIdRef.current) return;
          onFailed();
        };
      }
    };

    // Clear drawing layer BEFORE resetting the SelectTool so that when activate()
    // calls updateBoundingBox() → getSelectedItems(), the layer is already empty
    // and no highlight clones are recreated for the old sprite.
    const dl = scope.project.layers.find((l) => l.name === 'drawing');
    if (dl) {
      [...dl.children].forEach((child) => {
        if (child.name !== 'PBT_BOUNDS_BOX') child.remove();
      });
    }

    clearSelectionForCostumeSwitch();

    const format = detectFormat(initialUrl);

    const handleRasterLoad = (raster: paper.Raster, isInitialLoad: boolean = false) => {
      if (!scope || !scope.project) return;

      const dl = scope.project.layers.find((l) => l.name === 'drawing');
      if (dl && raster.layer !== dl) {
        dl.addChild(raster);
      }

      const finalizeRaster = () => {
        // Guard: if another costume was loaded after this one started, discard
        if (loadId !== currentLoadIdRef.current) {
          raster.remove();
          return;
        }
        if (!scope || !scope.project) return;
        const stageCenter = new scope.Point(DRAWING_CONFIG.canvas.w / 2, DRAWING_CONFIG.canvas.h / 2);
        raster.position = stageCenter;

        const rb = raster.bounds;
        const scaleFactor = isBackdropRef.current ? 1.0 : 0.8;
        const maxW = DRAWING_CONFIG.artboard.w * scaleFactor;
        const maxH = DRAWING_CONFIG.artboard.h * scaleFactor;

        if (rb.width > maxW || rb.height > maxH || isBackdropEffective) {
          const scale = Math.min(maxW / rb.width, maxH / rb.height);
          raster.scale(scale);
        }

        if (isInitialLoad) {
          setInitialState();
        } else {
          saveHistory();
        }

        // syncToContext gera: PNG como `url` (para paint editor recarregar) e
        // SVG wrapper como `stageUrl` (para o palco renderizar no tamanho correto).
        requestAnimationFrame(() => syncToContext());

        setTimeout(() => zoomAfterLoadRef.current(), 50);
      };


      // IMPORTANTE: Para que o PNG/JPG apareça no palco (Stage), ele não pode ser 
      // apenas um link para um arquivo local. Precisamos "desenhar" ele em um canvas
      // interno para que, na exportação do SVG, o Paper.js embuta a imagem como Base64.
      const forceInternalCanvas = () => {
        if (!raster.canvas || raster.image instanceof HTMLImageElement) {
          const canvas = document.createElement('canvas');
          canvas.width = raster.width;
          canvas.height = raster.height;
          const ctx = canvas.getContext('2d');
          if (ctx && raster.image) {
            ctx.drawImage(raster.image as HTMLImageElement, 0, 0);
            raster.image = canvas;
          }
        }
        requestAnimationFrame(finalizeRaster);
      };

      const needsDownsample = raster.width > 2000 || raster.height > 2000;
      if (needsDownsample && typeof createImageBitmap === 'function') {
        const maxSafetyDim = 1200;
        const ratio = Math.min(maxSafetyDim / raster.width, maxSafetyDim / raster.height);
        const newW = Math.max(1, Math.floor(raster.width * ratio));
        const newH = Math.max(1, Math.floor(raster.height * ratio));

        const sourceImage = raster.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap;
        createImageBitmap(sourceImage, { resizeWidth: newW, resizeHeight: newH, resizeQuality: 'high' })
          .then((bitmap) => {
            if (loadId !== currentLoadIdRef.current) {
              bitmap.close();
              raster.remove();
              return;
            }
            const offscreen = document.createElement('canvas');
            offscreen.width = newW;
            offscreen.height = newH;
            const ctx = offscreen.getContext('2d');
            if (ctx) {
              ctx.drawImage(bitmap, 0, 0);
              bitmap.close();
              raster.image = offscreen;
            }
            requestAnimationFrame(finalizeRaster);
          })
          .catch(() => {
            if (loadId !== currentLoadIdRef.current) {
              raster.remove();
              return;
            }
            console.warn('[PaintEditor] createImageBitmap falhou no downsample, usando imagem original.');
            forceInternalCanvas();
          });
      } else {
        forceInternalCanvas();
      }
    };

    if (format === 'svg') {
      decodeSvgUrl(initialUrl)
        .then((svgString) => {
          if (loadId !== currentLoadIdRef.current) return;

          // Regex robusto para detectar o viewBox oficial do palco (272 120 480 360)
          // aceitando variações de decimais (.00) e espaços.
          const picoViewBoxRegex = /viewBox\s*=\s*["']272(\.0+)?\s+120(\.0+)?\s+480(\.0+)?\s+360(\.0+)?["']/;
          const hasPicoMarker = svgString.includes('PBT_BOUNDS_BOX') || picoViewBoxRegex.test(svgString);

          // Se a URL é um data URI gerado por nós, preserva posição absoluta (hasPicoMarker=true).
          // Nota: fantasias raster agora armazenam PNG diretamente (não chegam aqui como SVG).
          const isInternal = initialUrl.startsWith('data:');
          importSvgString(svgString, true, isInternal || hasPicoMarker, loadId);
        })
        .catch((err: any) => {
          if (loadId !== currentLoadIdRef.current) return;
          console.error('[PaintEditor] Erro ao carregar/decodificar SVG:', err);
          console.warn('[PaintEditor] Fallback para Raster devido a erro no SVG');
          loadRasterSafely(
            initialUrl,
            (raster) => handleRasterLoad(raster, true),
            () => console.error('[PaintEditor] Erro fatal ao carregar imagem raster (fallback):', initialUrl),
          );
        });
    } else {
      loadRasterSafely(
        initialUrl,
        (raster) => handleRasterLoad(raster, true),
        () => console.error('[PaintEditor] Erro fatal ao carregar imagem raster:', initialUrl),
      );
    }
  }, [
    scope,
    initialUrl,
    costumeId,
    importSvgString,
    isBackdrop,
    clearSelectionForCostumeSwitch,
    syncToContext,
    saveHistory,
    setInitialState,
    zoomToFit,
  ]);

  const handleFlip = useCallback(
    (axis: 'x' | 'y') => {
      if (!scope) return;

      const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
      // Pega apenas os filhos diretos da camada de desenho que estão selecionados.
      // Isso é o mais seguro para evitar inversões duplas ou heranças estranhas do Paper.js.
      const selected = dl.children.filter((i) => i.selected && !i.locked && !(i as unknown as IPaintItem).guide);

      if (selected.length === 0) return;

      let totalBounds: paper.Rectangle | null = null;
      selected.forEach((item) => {
        if (!totalBounds) totalBounds = item.bounds.clone();
        else totalBounds = (totalBounds as paper.Rectangle).unite(item.bounds);
      });

      if (totalBounds) {
        const center = (totalBounds as paper.Rectangle).center;
        selected.forEach((item) => {
          item.scale(axis === 'x' ? -1 : 1, axis === 'y' ? -1 : 1, center);
        });
        saveHistory();
        notifyProjectChange();
      }
    },
    [scope, saveHistory, notifyProjectChange],
  );

  const handleGroup = useCallback(() => {
    if (!scope) return;
    const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
    const selected = dl.children.filter((i) => i.selected && !i.locked && !(i as unknown as IPaintItem).guide);
    if (selected.length > 1) {
      new scope.Group(selected);
      saveHistory();
      notifyProjectChange();
    }
  }, [scope, saveHistory, notifyProjectChange]);

  const handleUngroup = useCallback(() => {
    if (!scope) return;
    const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
    const itemsToUngroup = dl.children.filter((i) => i.selected && i instanceof scope.Group);
    let changed = false;

    itemsToUngroup.forEach((item) => {
      if (item instanceof scope.Group && item.parent) {
        const parent = item.parent;
        const index = item.index;
        const children = item.removeChildren();
        parent.insertChildren(index, children);
        children.forEach((c) => (c.selected = true));
        item.remove();
        changed = true;
      }
    });
    if (changed) {
      saveHistory();
      notifyProjectChange();
    }
  }, [scope, saveHistory, notifyProjectChange]);

  const handleLayering = useCallback(
    (action: 'front' | 'back' | 'forward' | 'backward') => {
      if (!scope) return;
      const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
      const selected = dl.children.filter((i) => i.selected && !i.locked && !(i as unknown as IPaintItem).guide);
      if (selected.length === 0) return;

      selected.forEach((item) => {
        switch (action) {
          case 'front':
            item.bringToFront();
            break;
          case 'back':
            item.sendToBack();
            break;
          case 'forward': {
            const next = item.nextSibling;
            if (next) item.insertAbove(next);
            break;
          }
          case 'backward': {
            const prev = item.previousSibling;
            if (prev) item.insertBelow(prev);
            break;
          }
        }
      });
      saveHistory();
      notifyProjectChange();
    },
    [scope, saveHistory, notifyProjectChange],
  );

  const handleDelete = useCallback(() => {
    if (!scope) return;
    const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
    const selected = dl.children.filter((i) => i.selected && !i.locked && !(i as unknown as IPaintItem).guide);
    if (selected.length > 0) {
      selected.forEach((item) => item.remove());
      saveHistory();
      notifyProjectChange();
    }
  }, [scope, saveHistory, notifyProjectChange]);

  const handleDuplicate = useCallback(() => {
    if (!scope) return;
    const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
    const selected = dl.children.filter((i) => i.selected && !i.locked && !(i as unknown as IPaintItem).guide);
    if (selected.length > 0) {
      selected.forEach((item) => {
        const copy = item.copyTo(item.parent as paper.Group);
        copy.position = copy.position.add(new scope.Point(10, 10));
        copy.selected = true;
        item.selected = false;
      });
      saveHistory();
      notifyProjectChange();
    }
  }, [scope, saveHistory, notifyProjectChange]);

  // Clipboard
  const clipboardRef = useRef<string[]>([]);

  const handleCopy = useCallback(() => {
    if (!scope) return;
    const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
    const selected = dl.children.filter((i) => i.selected && !i.locked && !(i as unknown as IPaintItem).guide);
    if (selected.length > 0) {
      clipboardRef.current = selected.map((item) => item.exportJSON());
    }
  }, [scope]);

  const handlePaste = useCallback(() => {
    if (!scope || clipboardRef.current.length === 0) return;
    const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
    dl.children.forEach((i) => { i.selected = false; });
    clipboardRef.current.forEach((json) => {
      scope.activate();
      const item = scope.project.importJSON(json) as paper.Item;
      dl.addChild(item);
      item.position = item.position.add(new scope.Point(10, 10));
      item.selected = true;
    });
    saveHistory();
    notifyProjectChange();
  }, [scope, saveHistory, notifyProjectChange]);

  const handleSelectAll = useCallback(() => {
    if (!scope) return;
    const dl = scope.project.layers.find((l) => l.name === 'drawing') || scope.project.activeLayer;
    dl.children.forEach((i) => {
      if (!(i as unknown as IPaintItem).guide && !i.locked) i.selected = true;
    });
    notifyProjectChange();
  }, [scope, notifyProjectChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textInput.visible) return;
      const target = e.target as HTMLElement;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        handleDelete();
      }

      if (e.ctrlKey || e.metaKey) {
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo(); else undo();
          notifyProjectChange();
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleCopy();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          handlePaste();
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handleSelectAll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, textInput.visible, handleDelete, handleCopy, handlePaste, handleSelectAll, notifyProjectChange]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none text-slate-800 font-sans min-h-0">
      <Header
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => {
          undo();
          notifyProjectChange();
        }}
        onRedo={() => {
          redo();
          notifyProjectChange();
        }}
        onFlipHorizontal={() => handleFlip('x')}
        onFlipVertical={() => handleFlip('y')}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        onBringToFront={() => handleLayering('front')}
        onSendToBack={() => handleLayering('back')}
        onMoveForward={() => handleLayering('forward')}
        onMoveBackward={() => handleLayering('backward')}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        fillColor={state.fillColor}
        strokeColor={state.strokeColor}
        strokeWidth={state.strokeWidth}
        brushSize={state.brushSize}
        fillTransparent={state.fillTransparent}
        strokeTransparent={state.strokeTransparent}
        fontFamily={state.fontFamily}
        fontSize={state.fontSize}
        activeToolId={activeToolId}
        onChangeState={(changes) => setState((s) => ({ ...s, ...changes }))}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Toolbar activeToolId={activeToolId} onSelectTool={activateTool} />

        <CanvasView
          scope={scope}
          canvasRef={canvasRef}
          scrollPos={scrollPos}
          onScroll={updateScroll}
          textInput={textInput}
          setTextInputValue={(val) => setTextInput({ ...textInput, value: val })}
          onTextCommit={() => {
            if (textInput.point) commitText(textInput.value, textInput.point);
            setTextInput({ ...textInput, visible: false, value: '', point: null });
          }}
          zoom={zoom}
          onZoomIn={() => setZoom(zoom * 1.2)}
          onZoomOut={() => setZoom(zoom / 1.2)}
          onZoomToFit={zoomToFit}
        />
      </div>
    </div>
  );
};

export default PaintEditor;
