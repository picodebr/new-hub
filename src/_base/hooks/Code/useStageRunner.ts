/**
 * useStageRunner - O motor de execução em tempo real para o Palco.
 *
 * Responsabilidade: Gerencia o ciclo de vida das pilhas (stacks) de blocos,
 * controlando o estado 'rodando/parado' e provendo as primitivas lógicas de
 * movimento, aparência e detecção de bordas (bounce). Atua como o "Kernel"
 * da simulação, garantindo que os comandos assíncronos (ex: wait) não
 * bloqueiem a interface principal.
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { SpriteData, BackdropData, SoundData } from '../../domain/entities';

import { getCollisionEngine } from '../../engine/webgl';
import { dragState } from '../../lib/dragState';
import { getProjectService, getSerialService } from '@/_base/services/code';
import { getExecutionEngine } from '@/_base/services/code/ExecutionEngine';

export function useStageRunner() {
  // ... setup states ...
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunningCount, setActiveRunningCount] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const { monitors, updateMonitorValue, updateMonitorItems } = useProject();

  // Refs para performance/sincronia em loops assíncronos
  const isRunningRef = useRef(false);
  const forceExecutionRef = useRef(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Listeners de Teclas e Estados de Entrada
  const keyListenersRef = useRef<{ [key: string]: (() => Promise<void>)[] }>({});
  const keysActiveRef = useRef<{ [key: string]: boolean }>({});
  const isMouseDownRef = useRef(false);
  const timerStartRef = useRef(0);
  const lastAnswerRef = useRef('');
  const resolveAskRef = useRef<((answer: string) => void) | null>(null);

  const projectService = getProjectService();

  const start = useCallback(() => {
    const engine = getExecutionEngine();
    engine.start();

    // Reset da comunicação com Arduino (Firmata) para leitura limpa
    const serialService = getSerialService();
    if (serialService.isConnected()) {
      const board = serialService.getBoard();
      if (board.softReset) board.softReset();
    }

    setIsRunning(true);
    isRunningRef.current = true;
    timeoutsRef.current = [];
    keyListenersRef.current = {};
    keysActiveRef.current = {};
    isMouseDownRef.current = false;
    timerStartRef.current = Date.now();
  }, []);

  const stop = useCallback(
    (clearStage: boolean = true) => {
      const engine = getExecutionEngine();
      // O engine.stop() já é chamado pelo handleStop no useCodeExecution,
      // mas chamamos aqui por segurança se disparado internamente.
      if (engine.isProjectRunning()) engine.stop();

      setIsRunning((prev) => (prev === false ? prev : false));
      isRunningRef.current = false;

      // Limpa temporizadores
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];

      // Reseta contador de execuções individuais
      setActiveRunningCount((prev) => (prev === 0 ? prev : 0));

      // Reseta Força de Execução
      if (forceExecutionRef.current !== 0) forceExecutionRef.current = 0;

      // Limpa Estado de Pergunta
      setActiveQuestion((prev) => (prev === null ? prev : null));
      if (resolveAskRef.current) {
        resolveAskRef.current('');
        resolveAskRef.current = null;
      }

      // Reseta Bolha de Fala/Efeitos se necessário (Manual Stop apenas)
      if (clearStage) {
        const initialSpritesCount = projectService.getSprites().length;
        projectService.clearClones();
        const sprites = projectService.getSprites();
        let hasChanges = initialSpritesCount !== sprites.length;

        sprites.forEach((s) => {
          if (s.bubbleText !== '' || s.bubbleType !== null) {
            // updateSprite incrementa stateRevision e emite spritesChange —
            // mutação direta aqui pulava o heartbeat e o balão não desaparecia.
            projectService.updateSprite(s.id, { bubbleText: '', bubbleType: null });
            hasChanges = true;
          }
        });
        if (hasChanges) {
          projectService.syncSprites();
        }
      }
    },
    [projectService],
  );

  const setForceExecution = useCallback((force: boolean) => {
    if (force) {
      forceExecutionRef.current += 1;
    } else {
      forceExecutionRef.current = Math.max(0, forceExecutionRef.current - 1);
    }
  }, []);

  const incrementActiveCode = useCallback(() => {
    setActiveRunningCount((prev) => prev + 1);
  }, []);

  const decrementActiveCode = useCallback(() => {
    setActiveRunningCount((prev) => Math.max(0, prev - 1));
  }, []);

  // --- Limites do Palco (Scratch: 480x360, centro em 0,0) ---
  const STAGE_LIMIT_X = 240;
  const STAGE_LIMIT_Y = 180;
  const MARGEM_SEGURANCA = 20;

  const clampX = (x: number, sprite?: SpriteData) => {
    const lim = STAGE_LIMIT_X;
    return Math.max(-lim, Math.min(lim, x));
  };

  const clampY = (y: number, sprite?: SpriteData) => {
    const lim = STAGE_LIMIT_Y;
    return Math.max(-lim, Math.min(lim, y));
  };
  const normalizeAngle = (angle: number) => {
    let deg = angle % 360;
    if (deg > 180) deg -= 360;
    if (deg <= -180) deg += 360;
    return deg;
  };

  // --- Primitivas de Execução ---

  const checkExecution = useCallback(() => {
    return isRunningRef.current || forceExecutionRef.current > 0;
  }, []);

  const wait = useCallback(
    (secs: number) => {
      return new Promise<void>((resolve) => {
        if (!checkExecution()) {
          resolve();
          return;
        }
        const ms = secs * 1000;
        const timeout = setTimeout(() => {
          resolve();
        }, ms);
        timeoutsRef.current.push(timeout);
      });
    },
    [checkExecution],
  );

  const yieldFrame = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!checkExecution()) {
        resolve();
        return;
      }
      // Atrela o yield ao próximo frame visual da tela (garante 60fps exatos e pausa se abas ficarem inativas)
      requestAnimationFrame(() => resolve());
    });
  }, [checkExecution]);

  // --- Ações de Movimento ---

  const move = useCallback(
    async (steps: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();

      // Se estiver arrastando, apenas cede o frame para não acelerar o loop do script
      if (dragState.draggingId === id) {
        await yieldFrame();
        return;
      }

      const sprite = projectService.getSpriteById(id);
      if (sprite) {
        const rad = sprite.angle * (Math.PI / 180);
        const dx = steps * Math.sin(rad);
        const dy = steps * Math.cos(rad);

        projectService.updateSprite(
          id,
          {
            x: clampX(sprite.x + dx, sprite),
            y: clampY(sprite.y + dy, sprite),
          },
          true,
        );
        getCollisionEngine()?.clearCache();
      }
    },
    [projectService, checkExecution, yieldFrame, clampX, clampY],
  );

  const turn = useCallback(
    async (deg: number, targetId?: string) => {
      if (!checkExecution()) return;

      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);

      if (sprite) {
        projectService.updateSprite(
          id,
          {
            angle: normalizeAngle(sprite.angle + deg),
          },
          true,
        );
        getCollisionEngine()?.clearCache();
      }
    },
    [projectService, checkExecution, yieldFrame],
  );

  const goTo = useCallback(
    async (x: number, y: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();

      if (dragState.draggingId === id) {
        await yieldFrame();
        return;
      }

      const sprite = projectService.getSpriteById(id);
      projectService.updateSprite(id, { x: clampX(x, sprite), y: clampY(y, sprite) });
      getCollisionEngine()?.clearCache();
    },
    [projectService, checkExecution, yieldFrame, clampX, clampY],
  );

  const setX = useCallback(
    async (x: number, targetId?: string) => {
      if (!checkExecution()) return;
      const numX = Number(x);
      if (isNaN(numX)) return;
      const id = targetId || projectService.getActiveSpriteId();

      if (dragState.draggingId === id) {
        await yieldFrame();
        return;
      }

      const sprite = projectService.getSpriteById(id);
      projectService.updateSprite(id, { x: clampX(numX, sprite) }, true);
      getCollisionEngine()?.clearCache();
    },
    [projectService, checkExecution, yieldFrame, clampX],
  );

  const setY = useCallback(
    async (y: number, targetId?: string) => {
      if (!checkExecution()) return;
      const numY = Number(y);
      if (isNaN(numY)) return;
      const id = targetId || projectService.getActiveSpriteId();

      if (dragState.draggingId === id) {
        await yieldFrame();
        return;
      }

      const sprite = projectService.getSpriteById(id);
      projectService.updateSprite(id, { y: clampY(numY, sprite) }, true);
      getCollisionEngine()?.clearCache();
    },
    [projectService, checkExecution, yieldFrame, clampY],
  );

  const addX = useCallback(
    async (dx: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();

      if (dragState.draggingId === id) {
        await yieldFrame();
        return;
      }

      const sprite = projectService.getSpriteById(id);
      if (sprite) {
        projectService.updateSprite(id, { x: clampX(sprite.x + dx, sprite) }, true);
      }
      await yieldFrame();
    },
    [projectService, checkExecution, yieldFrame, clampX],
  );

  const addY = useCallback(
    async (dy: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();

      if (dragState.draggingId === id) {
        await yieldFrame();
        return;
      }

      const sprite = projectService.getSpriteById(id);
      if (sprite) {
        projectService.updateSprite(id, { y: clampY(sprite.y + dy, sprite) }, true);
      }
      await yieldFrame();
    },
    [projectService, checkExecution, yieldFrame, clampY],
  );

  const setAngle = useCallback(
    (deg: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { angle: normalizeAngle(deg) });
    },
    [projectService, checkExecution],
  );

  const setRotationStyle = useCallback(
    (style: 'all around' | 'left-right' | "don't rotate", targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { rotationStyle: style });
    },
    [projectService, checkExecution],
  );

  const glide = useCallback(
    async (secs: number, x: number, y: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (!sprite) return;

      const startX = sprite.x;
      const startY = sprite.y;
      const targetX = clampX(x, sprite);
      const targetY = clampY(y, sprite);
      const duration = secs * 1000;
      const startTime = Date.now();

      return new Promise<void>((resolve) => {
        const animate = () => {
          if (!checkExecution()) {
            resolve();
            return;
          }

          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / duration);

          // Interpolação linear simples
          const currentX = startX + (targetX - startX) * progress;
          const currentY = startY + (targetY - startY) * progress;

          if (dragState.draggingId !== id) {
            projectService.updateSprite(id, { x: currentX, y: currentY }, true);
          }

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(animate);
      });
    },
    [projectService, checkExecution],
  );

  const bounceOnEdge = useCallback(
    async (targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();

      if (dragState.draggingId === id) {
        await yieldFrame();
        return;
      }

      const sprite = projectService.getSpriteById(id);

      if (sprite) {
        let newAngle = sprite.angle;
        const newX = sprite.x;
        const newY = sprite.y;
        let hit = false;

        const rad = sprite.angle * (Math.PI / 180);
        const vx = Math.sin(rad);
        const vy = Math.cos(rad);

        const spriteW = ((sprite.width || 0) * (sprite.size || 100)) / 100;
        const spriteH = ((sprite.height || 0) * (sprite.size || 100)) / 100;
        const limitX = STAGE_LIMIT_X;
        const limitY = STAGE_LIMIT_Y;

        if (newX <= -limitX && vx < 0) {
          newAngle = -sprite.angle;
          hit = true;
        }
        if (newX >= limitX && vx > 0) {
          newAngle = -sprite.angle;
          hit = true;
        }

        if (newY <= -limitY && vy < 0) {
          newAngle = 180 - sprite.angle;
          hit = true;
        }
        if (newY >= limitY && vy > 0) {
          newAngle = 180 - sprite.angle;
          hit = true;
        }

        if (hit) {
          projectService.updateSprite(id, { x: newX, y: newY, angle: normalizeAngle(newAngle) }, true);
        }
      }
      await yieldFrame();
    },
    [projectService, checkExecution, yieldFrame],
  );

  // --- Ações de Aparência ---

  const say = useCallback(
    (text: string | number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { bubbleText: String(text), bubbleType: 'say' });
    },
    [projectService, checkExecution],
  );

  const sayFor = useCallback(
    async (text: string | number, secs: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { bubbleText: String(text), bubbleType: 'say' });
      await wait(secs);
      projectService.updateSprite(id, { bubbleText: '', bubbleType: null });
    },
    [projectService, wait, checkExecution],
  );

  const think = useCallback(
    (text: string | number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { bubbleText: String(text), bubbleType: 'think' });
    },
    [projectService, checkExecution],
  );

  const thinkFor = useCallback(
    async (text: string | number, secs: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { bubbleText: String(text), bubbleType: 'think' });
      await wait(secs);
      projectService.updateSprite(id, { bubbleText: '', bubbleType: null });
    },
    [projectService, wait, checkExecution],
  );

  const setSize = useCallback(
    async (size: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { size }, true);
    },
    [projectService, checkExecution],
  );

  const changeSize = useCallback(
    async (delta: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (sprite) {
        projectService.updateSprite(id, { size: sprite.size + delta }, true);
      }
    },
    [projectService, checkExecution],
  );

  const show = useCallback(
    async (targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { visible: true }, true);
    },
    [projectService, checkExecution],
  );

  const hide = useCallback(
    async (targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { visible: false }, true);
    },
    [projectService, checkExecution],
  );

  const switchCostume = useCallback(
    async (costumeIdOrType: string, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (!sprite || !sprite.costumes || sprite.costumes.length === 0) return;

      let nextCostumeId = costumeIdOrType;
      const type = costumeIdOrType.toUpperCase();

      if (type === 'NEXT') {
        const currentIndex = sprite.costumes.findIndex((c) => c.id === sprite.currentCostumeId);
        const nextIndex = (currentIndex + 1) % sprite.costumes.length;
        nextCostumeId = sprite.costumes[nextIndex].id;
      } else if (type === 'PREVIOUS' || type === 'PREV') {
        const currentIndex = sprite.costumes.findIndex((c) => c.id === sprite.currentCostumeId);
        const nextIndex = (currentIndex - 1 + sprite.costumes.length) % sprite.costumes.length;
        nextCostumeId = sprite.costumes[nextIndex].id;
      } else if (type === 'RANDOM') {
        const nextIndex = Math.floor(Math.random() * sprite.costumes.length);
        nextCostumeId = sprite.costumes[nextIndex].id;
      }

      // Tenta achar por ID primeiro, depois por NAME
      const costume = sprite.costumes.find((c) => c.id === nextCostumeId) || sprite.costumes.find((c) => c.name === nextCostumeId);

      if (costume) {
        projectService.updateSprite(
          id,
          {
            currentCostumeId: costume.id,
            costume: costume.url,
          },
          true,
        );
        getCollisionEngine()?.clearCache();
      }
    },
    [projectService, checkExecution],
  );

  const setEffect = useCallback(
    (effect: string, value: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (sprite) {
        const newEffects = {
          ...(sprite.effects || {
            color: 0,
            fisheye: 0,
            whirl: 0,
            pixelate: 0,
            mosaic: 0,
            brightness: 0,
            ghost: 0,
          }),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newEffects as any)[effect] = value;
        projectService.updateSprite(id, { effects: newEffects });
      }
    },
    [projectService, checkExecution],
  );

  const changeEffect = useCallback(
    (effect: string, delta: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (sprite) {
        const newEffects = {
          ...(sprite.effects || {
            color: 0,
            fisheye: 0,
            whirl: 0,
            pixelate: 0,
            mosaic: 0,
            brightness: 0,
            ghost: 0,
          }),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newEffects as any)[effect] = ((newEffects as any)[effect] || 0) + delta;
        projectService.updateSprite(id, { effects: newEffects });
      }
    },
    [projectService, checkExecution],
  );

  const clearEffects = useCallback(
    (targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, {
        effects: { color: 0, fisheye: 0, whirl: 0, pixelate: 0, mosaic: 0, brightness: 0, ghost: 0 },
      });
    },
    [projectService, checkExecution],
  );

  const switchBackdrop = useCallback(
    async (idOrType: string) => {
      if (!checkExecution()) return;
      projectService.switchBackdrop(idOrType);
    },
    [projectService, checkExecution],
  );

  const switchBackdropAndWait = useCallback(
    async (idOrType: string) => {
      if (!checkExecution()) return;

      return new Promise<void>((resolve) => {
        const onDone = (backdropId: string) => {
          // Simplificação: no Scratch, 'AndWait' espera os scripts terminarem.
          // O evento 'backdropDone' é emitido pelo useCodeExecution quando todas as promessas de cenário acabam.
          projectService.off('backdropDone', onDone);
          resolve();
        };
        projectService.on('backdropDone', onDone);
        projectService.switchBackdrop(idOrType);
      });
    },
    [projectService, checkExecution],
  );

  const goToLayer = useCallback(
    (frontBack: 'front' | 'back', targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprites = [...projectService.getSprites()];
      const index = sprites.findIndex((s) => s.id === id);
      if (index !== -1) {
        const [sprite] = sprites.splice(index, 1);
        if (frontBack === 'front') {
          sprites.push(sprite);
        } else {
          sprites.unshift(sprite);
        }
        projectService.setSprites(sprites);
      }
    },
    [projectService, checkExecution],
  );

  const goForwardLayers = useCallback(
    (num: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprites = [...projectService.getSprites()];
      const index = sprites.findIndex((s) => s.id === id);
      if (index !== -1) {
        const [sprite] = sprites.splice(index, 1);
        const newIndex = Math.max(0, Math.min(sprites.length, index + num));
        sprites.splice(newIndex, 0, sprite);
        projectService.setSprites(sprites);
      }
    },
    [projectService, checkExecution],
  );
  
  const setDraggable = useCallback(
    (draggable: boolean, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { draggable });
    },
    [projectService, checkExecution],
  );

  // --- Ações de Mouse & Teclado ---

  // --- RASTREAMENTO DO MOUSE ---
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getMouseStageCoords = () => {
    const container = document.getElementById('stage-main-container');
    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawX = mouseRef.current.x - centerX;
    const rawY = centerY - mouseRef.current.y;

    const LIMIT_X = 240;
    const LIMIT_Y = 180;

    const x = Math.max(-LIMIT_X, Math.min(rawX, LIMIT_X));
    const y = Math.max(-LIMIT_Y, Math.min(rawY, LIMIT_Y));

    return { x, y };
  };

  const goToMouse = useCallback(
    async (targetId?: string) => {
      if (!checkExecution()) return;
      const { x, y } = getMouseStageCoords();
      const id = targetId || projectService.getActiveSpriteId();

      if (dragState.draggingId === id) {
        await yieldFrame();
        return;
      }

      projectService.updateSprite(id, { x, y }, true);
      await yieldFrame();
    },
    [projectService, checkExecution, yieldFrame],
  );

  const pointToMouse = useCallback(
    async (targetId?: string) => {
      if (!checkExecution()) return;
      const { x: mouseX, y: mouseY } = getMouseStageCoords();
      const id = targetId || projectService.getActiveSpriteId();

      if (dragState.draggingId === id) {
        await yieldFrame();
        return;
      }

      const sprite = projectService.getSpriteById(id);

      if (sprite) {
        const dx = mouseX - sprite.x;
        const dy = mouseY - sprite.y;
        const radians = Math.atan2(dy, dx);
        const degreesStandard = radians * (180 / Math.PI);
        const degreesScratch = 90 - degreesStandard;

        projectService.updateSprite(id, { angle: normalizeAngle(degreesScratch) }, true);
      }
      await yieldFrame();
    },
    [projectService, checkExecution, yieldFrame],
  );

  const broadcast = useCallback(
    async (message: string) => {
      if (!checkExecution()) return;
      projectService.broadcast(message);
    },
    [projectService, checkExecution],
  );

  const broadcastAndWait = useCallback(
    async (message: string) => {
      if (!checkExecution()) return;

      return new Promise<void>((resolve) => {
        const onDone = (msg: string) => {
          if (msg === message) {
            projectService.off('broadcastDone', onDone);
            resolve();
          }
        };
        projectService.on('broadcastDone', onDone);
        projectService.broadcast(message);
      });
    },
    [projectService, checkExecution],
  );

  const createClone = useCallback(
    async (targetId: string, callerSpriteId?: string) => {
      if (!checkExecution()) return;

      // Se target for 'myself', usa o ID do ator chamador (passado pelo sandbox/VM).
      // Fallback para getActiveSpriteId() apenas quando callerSpriteId não é fornecido
      // (compatibilidade com chamadas diretas sem contexto de execução).
      const idToClone = targetId === 'myself' ? callerSpriteId || projectService.getActiveSpriteId() : targetId;
      const newClone = projectService.createClone(idToClone);

      if (newClone) {
        console.log(`[useStageRunner] Clone criado: ${newClone.id} a partir de ${idToClone}`);
        // Dispara evento para que useCodeExecution intercepte e rode o bloco "quando eu começar como um clone"
        window.dispatchEvent(new CustomEvent('sprite-cloned', { detail: { spriteId: newClone.id } }));
      }
    },
    [projectService, checkExecution],
  );

  const deleteClone = useCallback(
    async (targetId?: string) => {
      if (!checkExecution()) return;

      const idToDelete = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(idToDelete);

      if (sprite && sprite.isClone) {
        projectService.deleteSprite(idToDelete);
        console.log(`[useStageRunner] Clone deletado: ${idToDelete}`);
      }
    },
    [projectService, checkExecution],
  );

  // --- Ações de Som ---

  const resolveSound = useCallback((soundName: string, sprite: SpriteData): SoundData | null => {
    if (!soundName || soundName === 'NONE' || sprite.sounds.length === 0) return null;
    return sprite.sounds.find((s) => s.name === soundName) ?? null;
  }, []);

  const playSound = useCallback(
    async (soundName: string, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (!sprite) return;

      const sound = resolveSound(soundName, sprite);
      if (sound) {
        await projectService.playSound(sound.url, sprite.volume ?? 100);
      }
    },
    [projectService, checkExecution, resolveSound],
  );

  const playSoundUntilDone = useCallback(
    async (soundName: string, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (!sprite) return;

      const sound = resolveSound(soundName, sprite);
      if (sound) {
        await projectService.playSoundUntilDone(sound.url, sprite.volume ?? 100);
      }
    },
    [projectService, checkExecution, resolveSound],
  );

  const stopAllSounds = useCallback(async () => {
    projectService.stopAllSounds();
  }, [projectService]);

  const setSoundEffect = useCallback(
    (effect: string, value: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (sprite) {
        const effects = { ...(sprite.soundEffects || {}) };
        effects[effect] = value;
        projectService.updateSprite(id, { soundEffects: effects });
      }
    },
    [projectService, checkExecution],
  );

  const changeSoundEffect = useCallback(
    (effect: string, delta: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (sprite) {
        const effects = { ...(sprite.soundEffects || {}) };
        effects[effect] = (effects[effect] || 0) + delta;
        projectService.updateSprite(id, { soundEffects: effects });
      }
    },
    [projectService, checkExecution],
  );

  const clearSoundEffects = useCallback(
    (targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { soundEffects: {} });
    },
    [projectService, checkExecution],
  );

  const setVolume = useCallback(
    (volume: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      projectService.updateSprite(id, { volume: Math.max(0, Math.min(100, volume)) });
    },
    [projectService, checkExecution],
  );

  const changeVolume = useCallback(
    (delta: number, targetId?: string) => {
      if (!checkExecution()) return;
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      if (sprite) {
        const newVol = Math.max(0, Math.min(100, (sprite.volume || 100) + delta));
        projectService.updateSprite(id, { volume: newVol });
      }
    },
    [projectService, checkExecution],
  );

  const getVolume = useCallback(
    (targetId?: string) => {
      const id = targetId || projectService.getActiveSpriteId();
      const sprite = projectService.getSpriteById(id);
      return sprite ? (sprite.volume !== undefined ? sprite.volume : 100) : 100;
    },
    [projectService],
  );

  const registerKeyListener = useCallback((key: string, callback: () => Promise<void>) => {
    if (!keyListenersRef.current[key]) {
      keyListenersRef.current[key] = [];
    }
    keyListenersRef.current[key].push(callback);
  }, []);

  const clearKeyListeners = useCallback(() => {
    keyListenersRef.current = {};
  }, []);

  // Listener de Tecla Global com Normalização e Rastreamento de Estado (Polling)
  useEffect(() => {
    const normalizeKey = (key: string) => {
      if (key === ' ') return 'space';
      if (key === 'ArrowUp') return 'up arrow';
      if (key === 'ArrowDown') return 'down arrow';
      if (key === 'ArrowRight') return 'right arrow';
      if (key === 'ArrowLeft') return 'left arrow';
      if (key === 'Enter') return 'enter';
      return key?.length === 1 ? key.toLowerCase() : key;
    };

    // Purity fix: ensure timer starts at first mount if not already set
    if (timerStartRef.current === 0) timerStartRef.current = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const matchedKey = normalizeKey(e.key);

      // Marca como ativa para blocos "tecla pressionada?"
      keysActiveRef.current[matchedKey] = true;
      keysActiveRef.current['any'] = true; // Scratch: 'any' key is true if any key is down

      if (!isRunningRef.current) return;

      const listeners = keyListenersRef.current[matchedKey];
      if (listeners) {
        listeners.forEach((cb) => cb().catch(console.error));
      }

      const anyListeners = keyListenersRef.current['any'];
      if (anyListeners) {
        anyListeners.forEach((cb) => cb().catch(console.error));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const matchedKey = normalizeKey(e.key);
      delete keysActiveRef.current[matchedKey];

      // Se não houver mais nenhuma tecla pressionada (além do marcador 'any'), remove o 'any'
      const activeKeys = Object.keys(keysActiveRef.current).filter((k) => k !== 'any');
      if (activeKeys.length === 0) {
        delete keysActiveRef.current['any'];
      }
    };

    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };
    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Sincronização com o Motor Global
  // CORREÇÃO: Os dois setState (setIsRunning + setActiveRunningCount) agora são agrupados
  // em um único callback por evento, garantindo que o React 18 automatic batching os processe
  // em um único re-render ao invés de dois renders consecutivos.
  // Adicionalmente, usamos o padrão funcional `setState(prev => ...)` para evitar leituras
  // de closures stale — o valor anterior é sempre o valor mais atual no momento da execução.
  useEffect(() => {
    const engine = getExecutionEngine();

    const handleEngineStart = () => {
      isRunningRef.current = true;
      setIsRunning(true);
      setActiveRunningCount(engine.getActiveTaskCount());
    };

    const handleEngineStop = () => {
      isRunningRef.current = false;
      setIsRunning(false);
      setActiveRunningCount(0);
    };

    const handleTaskStart = () => {
      // Apenas atualiza a contagem — isRunning já foi definido pelo engine:start
      setActiveRunningCount(engine.getActiveTaskCount());
    };

    const handleTaskEnd = () => {
      setActiveRunningCount(engine.getActiveTaskCount());
    };

    engine.on('engine:start', handleEngineStart);
    engine.on('engine:stop', handleEngineStop);
    engine.on('task:start', handleTaskStart);
    engine.on('task:end', handleTaskEnd);

    return () => {
      engine.off('engine:start', handleEngineStart);
      engine.off('engine:stop', handleEngineStop);
      engine.off('task:start', handleTaskStart);
      engine.off('task:end', handleTaskEnd);
    };
  }, []);
  const triggerKey = useCallback(async (key: string) => {
    const listeners = keyListenersRef.current[key];
    if (listeners) {
      await Promise.all(listeners.map((cb) => cb()));
    }
  }, []);

  // --- SENSORES (Reporters) ---

  /**
   * getSensingState - Retorna um snapshot do estado global para sincronizar sandboxes.
   */
  const getSensingState = useCallback(() => {
    const { x, y } = getMouseStageCoords();
    return {
      type: 'UPDATE_SENSORS_STATE' as const,
      keys: keysActiveRef.current,
      mouseDown: isMouseDownRef.current,
      mouseX: x,
      mouseY: y,
      timer: (Date.now() - timerStartRef.current) / 1000,
      answer: lastAnswerRef.current,
    };
  }, []);

  // --- MONITOR UPDATES (Polling) ---
  const monitorsRef = useRef(monitors);
  useEffect(() => {
    monitorsRef.current = monitors;
  }, [monitors]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const currentMonitors = monitorsRef.current;
      if (currentMonitors.length === 0) return;

      currentMonitors.forEach((monitor) => {
        if (!monitor.visible) return;

        // Listas são sincronizadas diretamente pelo BlockInterpreter._syncListMonitor (VM path)
        // e pelo __picoUpdateListMonitor (sandbox path) — sem polling necessário
        if (monitor.type === 'list') return;

        // ─── Monitor Escalar (variável / sensor) ──────────────────
        let newValue: string | number = monitor.value;

        // Sensores Globais
        if (monitor.spriteId === 'stage') {
          if (monitor.id === 'sensing_timer') {
            newValue = ((Date.now() - timerStartRef.current) / 1000).toFixed(1);
          } else if (monitor.id === 'sensing_answer') {
            newValue = lastAnswerRef.current || '';
          } else if (monitor.id === 'sensing_mousex') {
            newValue = Math.round(getMouseStageCoords().x);
          } else if (monitor.id === 'sensing_mousey') {
            newValue = Math.round(getMouseStageCoords().y);
          } else if (monitor.id.startsWith('looks_backdropnumbername')) {
            const backdrops = projectService.backdrops;
            const activeId = projectService.activeBackdropId;
            const index = backdrops.findIndex((b: BackdropData) => b.id === activeId);
            if (monitor.id.includes('name')) {
              newValue = backdrops[index]?.name || '';
            } else {
              newValue = index + 1;
            }
          }
        } else {
          // Sensores de Ator (posicao_x_SpriteId, etc.)
          const sprite = projectService.getSpriteById(monitor.spriteId);
          if (sprite) {
            if (monitor.id.startsWith('posicao_x')) newValue = Math.round(sprite.x);
            else if (monitor.id.startsWith('posicao_y')) newValue = Math.round(sprite.y);
            else if (monitor.id.startsWith('direcao')) newValue = Math.round(sprite.angle);
            else if (monitor.id.startsWith('looks_size')) newValue = Math.round(sprite.size);
            else if (monitor.id.startsWith('looks_costumenumbername')) {
              const index = sprite.costumes.findIndex((c) => c.id === sprite.currentCostumeId);
              if (monitor.id.includes('name')) {
                newValue = sprite.costumes[index]?.name || '';
              } else {
                newValue = index + 1;
              }
            }
          }
        }

        if (newValue !== monitor.value) {
          updateMonitorValue(monitor.id, newValue);
        }
      });
    }, 100); // 10 FPS is enough for monitors

    return () => clearInterval(updateInterval);
  }, [updateMonitorValue, updateMonitorItems, projectService]);

  const isTouching = useCallback(
    (spriteId: string, target: string): boolean => {
      const sprite = projectService.getSpriteById(spriteId);
      if (!sprite) return false;

      if (!sprite.visible) return false;

      if (target === '_mouse_') {
        const { x: mx, y: my } = getMouseStageCoords();
        const w = (sprite.width || 50) * ((sprite.size || 100) / 100);
        const h = (sprite.height || 50) * ((sprite.size || 100) / 100);
        return mx >= sprite.x - w / 2 && mx <= sprite.x + w / 2 && my >= sprite.y - h / 2 && my <= sprite.y + h / 2;
      }

      if (target === '_edge_') {
        const w = (sprite.width || 50) * ((sprite.size || 100) / 100);
        const h = (sprite.height || 50) * ((sprite.size || 100) / 100);
        const limitX = STAGE_LIMIT_X + w / 2 - MARGEM_SEGURANCA;
        const limitY = STAGE_LIMIT_Y + h / 2 - MARGEM_SEGURANCA;
        return Math.abs(sprite.x) >= limitX || Math.abs(sprite.y) >= limitY;
      }

      // Colisão entre Atores — pixel-perfect via WebGL (inclui clones do alvo)
      const allSprites = projectService.getSprites();
      const originalTarget = allSprites.find((s) => s.id === target || s.name === target);
      if (originalTarget) {
        const candidates = allSprites.filter(
          (s) => (s.id === originalTarget.id || s.parentId === originalTarget.id) && s.id !== spriteId && s.visible !== false,
        );

        const collision = getCollisionEngine();
        if (collision) {
          return collision.isTouchingSprite(sprite, candidates);
        }

        // Fallback AABB quando CollisionEngine não disponível
        const w1 = (sprite.width || 50) * ((sprite.size || 100) / 100);
        const h1 = (sprite.height || 50) * ((sprite.size || 100) / 100);
        for (const cand of candidates) {
          const w2 = (cand.width || 50) * ((cand.size || 100) / 100);
          const h2 = (cand.height || 50) * ((cand.size || 100) / 100);
          if (Math.abs(sprite.x - cand.x) < (w1 + w2) / 2 && Math.abs(sprite.y - cand.y) < (h1 + h2) / 2) return true;
        }
      }

      return false;
    },
    [projectService],
  );

  /**
   * touchingColor - Detecção de cor no Palco usando WebGL!
   */
  const touchingColor = useCallback(
    async (hex: string, targetId?: string): Promise<boolean> => {
      if (!checkExecution()) return false;
      const collision = getCollisionEngine();
      if (!collision) return false;

      const id = targetId || projectService.getActiveSpriteId();

      // Pega sprites, activeBackdrop
      const sprites = projectService.getSprites();
      const backdropUrl = projectService.activeBackdrop?.url || null;

      return await collision.isTouchingColor(id, hex, backdropUrl, sprites);
    },
    [projectService, checkExecution],
  );

  const colorTouchingColor = useCallback(
    async (hex1: string, hex2: string, targetId?: string): Promise<boolean> => {
      if (!checkExecution()) return false;
      const collision = getCollisionEngine();
      if (!collision) return false;

      const id = targetId || projectService.getActiveSpriteId();
      const sprites = projectService.getSprites();
      const backdropUrl = projectService.activeBackdrop?.url || null;

      return await collision.isColorTouchingColor(id, hex1, hex2, backdropUrl, sprites);
    },
    [projectService, checkExecution],
  );

  const getDistanceTo = useCallback(
    (spriteId: string, target: string): number => {
      const sprite = projectService.getSpriteById(spriteId);
      if (!sprite) return 0;

      let tx = 0,
        ty = 0;
      if (target === '_mouse_') {
        const { x, y } = getMouseStageCoords();
        tx = x;
        ty = y;
      } else {
        // Inclui clones: retorna distância ao candidato mais próximo
        const allSprites = projectService.getSprites();
        const originalTarget = allSprites.find((s) => s.id === target || s.name === target);
        if (originalTarget) {
          const candidates = allSprites.filter((s) => s.id === originalTarget.id || s.parentId === originalTarget.id);
          let minDist = Infinity;
          for (const cand of candidates) {
            const d = Math.sqrt(Math.pow(sprite.x - cand.x, 2) + Math.pow(sprite.y - cand.y, 2));
            if (d < minDist) {
              minDist = d;
              tx = cand.x;
              ty = cand.y;
            }
          }
        }
      }

      return Math.sqrt(Math.pow(sprite.x - tx, 2) + Math.pow(sprite.y - ty, 2));
    },
    [projectService],
  );

  const resetTimer = useCallback(() => {
    timerStartRef.current = Date.now();
  }, []);

  const askAndWait = useCallback(
    async (question: string, targetId?: string): Promise<string> => {
      const id = targetId || projectService.getActiveSpriteId();

      // Exibe o balão de fala no Ator
      projectService.updateSprite(id, { bubbleText: String(question), bubbleType: 'say' });

      setActiveQuestion(question);
      return new Promise<string>((resolve) => {
        resolveAskRef.current = (answer: string) => {
          lastAnswerRef.current = answer;
          setActiveQuestion(null);

          // Limpa o balão de fala
          projectService.updateSprite(id, { bubbleText: '', bubbleType: null });

          resolveAskRef.current = null;
          resolve(answer);
        };
      });
    },
    [projectService],
  );

  const getSpriteProperty = useCallback(
    (target: string, property: string): string | number => {
      if (target === '_stage_') {
        const backdrops = projectService.backdrops;
        const activeBackdropId = projectService.activeBackdropId;
        if (property === 'backdrop_number') return backdrops.findIndex((b: any) => b.id === activeBackdropId) + 1;
        if (property === 'backdrop_name') return backdrops.find((b: any) => b.id === activeBackdropId)?.name || '';
        return 0;
      }

      const sprite = projectService.getSprites().find((s) => s.id === target || s.name === target);
      if (!sprite) return 0;

      switch (property) {
        case 'x':
          return Math.round(sprite.x);
        case 'y':
          return Math.round(sprite.y);
        case 'direction':
          return Math.round(sprite.angle);
        case 'costume_number':
          return sprite.costumes.findIndex((c) => c.id === sprite.currentCostumeId) + 1;
        case 'costume_name':
          return sprite.costumes.find((c) => c.id === sprite.currentCostumeId)?.name || '';
        case 'size':
          return sprite.size;
        case 'volume':
          return sprite.volume !== undefined ? sprite.volume : 100;
        default:
          return 0;
      }
    },
    [projectService],
  );

  const submitAsk = useCallback((answer: string) => {
    if (resolveAskRef.current) {
      resolveAskRef.current(answer);
    }
  }, []);

  return useMemo(
    () => ({
      isRunning,
      start,
      stop,
      setForceExecution,
      // Ações
      move,
      turn,
      goTo,
      setX,
      setY,
      addX,
      addY,
      setAngle,
      setRotationStyle,
      glide,
      bounceOnEdge,
      say,
      sayFor,
      think,
      thinkFor,
      wait,
      setSize,
      changeSize,
      show,
      hide,
      switchCostume,
      setEffect,
      changeEffect,
      clearEffects,
      goToLayer,
      goForwardLayers,
      switchBackdrop,
      switchBackdropAndWait,
      goToMouse,
      pointToMouse,
      broadcast,
      broadcastAndWait,
      createClone,
      deleteClone,
      registerKeyListener,
      clearKeyListeners,
      triggerKey,
      activeRunningCount,
      incrementActiveCode,
      decrementActiveCode,
      getSensingState,
      isTouching,
      getDistanceTo,
      resetTimer,
      askAndWait,
      getSpriteProperty,
      touchingColor,
      colorTouchingColor,
      activeQuestion,
      submitAsk,
      playSound,
      playSoundUntilDone,
      stopAllSounds,
      setSoundEffect,
      changeSoundEffect,
      clearSoundEffects,
      setVolume,
      changeVolume,
      getVolume,
      updateMonitorValue,
      setDraggable,

    }),
    [
      isRunning,
      start,
      stop,
      setForceExecution,
      move,
      turn,
      goTo,
      setX,
      setY,
      addX,
      addY,
      setAngle,
      setRotationStyle,
      glide,
      bounceOnEdge,
      say,
      sayFor,
      think,
      thinkFor,
      wait,
      setSize,
      changeSize,
      show,
      hide,
      switchCostume,
      goToMouse,
      pointToMouse,
      broadcast,
      broadcastAndWait,
      createClone,
      deleteClone,
      registerKeyListener,
      clearKeyListeners,
      triggerKey,
      activeRunningCount,
      incrementActiveCode,
      decrementActiveCode,
      getSensingState,
      isTouching,
      getDistanceTo,
      resetTimer,
      askAndWait,
      getSpriteProperty,
      touchingColor,
      colorTouchingColor,
      activeQuestion,
      submitAsk,
      playSound,
      playSoundUntilDone,
      stopAllSounds,
      setSoundEffect,
      changeSoundEffect,
      clearSoundEffects,
      setVolume,
      changeVolume,
      getVolume,
      updateMonitorValue,
      setDraggable,

    ],
  );
}
