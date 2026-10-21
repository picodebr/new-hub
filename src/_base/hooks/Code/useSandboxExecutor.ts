/**
 * useSandboxExecutor - Motor de Execução Isolada (Sandbox).
 *
 * Este hook é responsável por gerenciar a execução de código JavaScript em ambientes
 * seguros e isolados (usando iframes via a classe CodeExecutor). Ele:
 * 1. Cria e mantém um executor para cada ator.
 * 2. Faz o roteamento das mensagens do sandbox (ex: "moverse") para ações reais no palco.
 * 3. Garante que um ator não possa interferir no código de outro.
 */
/**
 * Execução segura de código JavaScript em um contexto isolado (Iframe).
 */
import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useExecutionRunner } from '../../context/RuntimeContext';
import { useProject } from '../../context/ProjectContext';
import { useFirmware } from '../../context/FirmwareContext';
import { SpriteData } from '../../domain/entities';
import { getProjectService } from '../../services/code';
import { CodeExecutor } from '@/_base/services/code/CodeExecutor';

export function useSandboxExecutor() {
  const stageContext = useExecutionRunner(); // Acesso às funções reais (move, turn, etc)
  const { setIsRecognitionWindowOpen, setMonitorVisibility, updateMonitorValue, updateMonitorItems } = useProject();
  const { board } = useFirmware();
  const executorsRef = useRef<Map<string, CodeExecutor>>(new Map());

  // Helper para achar quem mandou a mensagem
  const findSpriteIdByWindow = (win: Window | null): string | null => {
    if (!win) return null;
    for (const [id, executor] of executorsRef.current.entries()) {
      if (executor.iframe && executor.iframe.contentWindow === win) {
        return id;
      }
    }
    return null;
  };

  const {
    clearKeyListeners,
    move,
    turn,
    say,
    sayFor,
    think,
    thinkFor,
    wait,
    goTo,
    setX,
    setY,
    addX,
    addY,
    goToMouse,
    pointToMouse,
    setAngle,
    setRotationStyle,
    glide,
    bounceOnEdge,
    sprites,
    switchCostume,
    switchBackdrop,
    switchBackdropAndWait,
    setEffect,
    changeEffect,
    clearEffects,
    goToLayer,
    goForwardLayers,
    setSize,
    changeSize,
    show,
    hide,
    registerKeyListener,
    createClone,
    deleteClone,
    getSensingState,
    isTouching,
    getDistanceTo,
    resetTimer,
    askAndWait,
    getSpriteProperty,
    touchingColor,
    colorTouchingColor,
  } = stageContext;

  // --- 1. OUVINTE DE MENSAGENS (Ouvir os iframes) ---
  // Ref para evitar recriar o listener de eventos quando as dependências mudam
  const handleMessageRef = useRef<((event: MessageEvent) => Promise<void>) | null>(null);

  // Atualiza a ref a cada renderização, mantendo a closure sempre atualizada com os dados corretos
  handleMessageRef.current = async (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.type !== 'SPRITE_ACTION') return;

    const spriteId = data.spriteId || findSpriteIdByWindow(event.source as Window);
    if (!spriteId) {
      console.warn('[useSandboxExecutor] Ignoring message from unknown source (no spriteId)', data);
      return;
    }

    try {
      let result;

      // Mapeia ações do Sandbox -> StageContext
      if (data.action === 'move') await move(data.args[0], spriteId);
      else if (data.action === 'turn') await turn(data.args[0], spriteId);
      else if (data.action === 'say') say(data.args[0], spriteId);
      else if (data.action === 'sayFor') await sayFor(data.args[0], data.args[1], spriteId);
      else if (data.action === 'think') think(data.args[0], spriteId);
      else if (data.action === 'thinkFor') await thinkFor(data.args[0], data.args[1], spriteId);
      else if (data.action === 'wait') await wait(data.args[0]);
      else if (data.action === 'goTo') goTo(data.args[0], data.args[1], spriteId);
      else if (data.action === 'setX') await setX(data.args[0], spriteId);
      else if (data.action === 'setY') await setY(data.args[0], spriteId);
      else if (data.action === 'addX') await addX(data.args[0], spriteId);
      else if (data.action === 'addY') await addY(data.args[0], spriteId);
      else if (data.action === 'goToMouse') await goToMouse(spriteId);
      else if (data.action === 'pointToMouse') await pointToMouse(spriteId);
      else if (data.action === 'pointInDirection') setAngle(data.args[0], spriteId);
      else if (data.action === 'glide') await glide(data.args[0], data.args[1], data.args[2], spriteId);
      else if (data.action === 'setRotationStyle') setRotationStyle(data.args[0], spriteId);
      else if (data.action === 'bounceOnEdge') await bounceOnEdge(spriteId);
      else if (data.action === 'yieldFrame') {
        // Aguarda o próximo frame real do navegador antes de responder ao sandbox.
        // Isso sincroniza os loops "para sempre" a ~60fps, igual ao Scratch.
        // Sem isso, o loop roda na velocidade do postMessage (centenas de fps, imprevisível).
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      } else if (data.action === 'broadcast') {
        getProjectService().emit('broadcast', data.args[0]);
      } else if (data.action === 'broadcastAndWait') {
        const message = data.args[0];
        const ps = getProjectService();
        await new Promise<void>((resolve) => {
          const onDone = (msg: string) => {
            if (msg === message) {
              ps.off('broadcastDone', onDone);
              resolve();
            }
          };
          ps.on('broadcastDone', onDone);
          ps.emit('broadcast', message);
        });
      }
      else if (data.action === 'createClone') await createClone(data.args[0], spriteId);
      else if (data.action === 'deleteClone') await deleteClone(spriteId);
      else if (data.action === 'setDraggable') stageContext.setDraggable(data.args[0], spriteId);
      // Sensores (StageRunner)
      else if (data.action === 'isTouching') result = isTouching(spriteId, data.args[0]);
      else if (data.action === 'isTouchingColor') result = await touchingColor(data.args[0], spriteId);
      else if (data.action === 'isColorTouchingColor') result = await colorTouchingColor(data.args[0], data.args[1], spriteId);
      else if (data.action === 'getDistanceTo') result = getDistanceTo(spriteId, data.args[0]);
      else if (data.action === 'resetTimer') resetTimer();
      else if (data.action === 'askAndWait') result = await askAndWait(data.args[0], spriteId);
      else if (data.action === 'getSpriteProperty') result = getSpriteProperty(data.args[0], data.args[1]);
      // Hardware (Placa)
      else if (data.action === 'getDigital') {
        result = board?.getDigital(data.args[0]);
      } else if (data.action === 'setDigital') {
        board?.setDigital(data.args[0], data.args[1]);
      } else if (data.action === 'getAnalog') {
        result = board?.getAnalog(data.args[0]);
      } else if (data.action === 'setPwm') {
        board?.setPwm(data.args[0], data.args[1]);
      } else if (data.action === 'setServo') {
        board?.setServo(data.args[0], data.args[1]);
      } else if (data.action === 'setPullup') {
        // setPullup não está na interface IHardwareBoard — verificamos em runtime
        const boardWithPullup = board as typeof board & { setPullup?: (pin: number | string) => void };
        boardWithPullup?.setPullup?.(data.args[0]);
      } else if (data.action === 'getUltrasonic') {
        const boardWithUltrasonic = board as typeof board & { getUltrasonic?: (trig: number | string, echo: number | string) => Promise<number> };
        result = await boardWithUltrasonic?.getUltrasonic?.(data.args[0], data.args[1]) ?? 0;
      }

      // Getters de estado do sprite
      else if (data.action === 'getX') {
        const sp = sprites?.find((s: SpriteData) => s.id === spriteId);
        result = sp ? Math.round(sp.x || 0) : 0;
      } else if (data.action === 'getY') {
        const sp = sprites?.find((s: SpriteData) => s.id === spriteId);
        result = sp ? Math.round(sp.y || 0) : 0;
      } else if (data.action === 'getAngle') {
        const sp = sprites?.find((s: SpriteData) => s.id === spriteId);
        result = sp ? Math.round(sp.angle || 90) : 90;
      }

      // Aparência
      else if (data.action === 'switchCostume') await switchCostume(data.args[0], spriteId);
      else if (data.action === 'switchBackdrop') await switchBackdrop(data.args[0]);
      else if (data.action === 'switchBackdropAndWait') await switchBackdropAndWait(data.args[0]);
      else if (data.action === 'setEffect') setEffect(data.args[0], data.args[1], spriteId);
      else if (data.action === 'changeEffect') changeEffect(data.args[0], data.args[1], spriteId);
      else if (data.action === 'clearEffects') clearEffects(spriteId);
      else if (data.action === 'goToLayer') goToLayer(data.args[0], spriteId);
      else if (data.action === 'goForwardLayers') goForwardLayers(data.args[0], spriteId);
      // Sounds
      else if (data.action === 'playSound') await stageContext.playSound(data.args[0], spriteId);
      else if (data.action === 'playSoundUntilDone') await stageContext.playSoundUntilDone(data.args[0], spriteId);
      else if (data.action === 'stopAllSounds') await stageContext.stopAllSounds();
      else if (data.action === 'stopAll') {
        stageContext.stop(true);
      } else if (data.action === 'setSoundEffect') stageContext.setSoundEffect(data.args[0], data.args[1], spriteId);
      else if (data.action === 'changeSoundEffect') stageContext.changeSoundEffect(data.args[0], data.args[1], spriteId);
      else if (data.action === 'clearSoundEffects') stageContext.clearSoundEffects(spriteId);
      else if (data.action === 'setVolume') stageContext.setVolume(data.args[0], spriteId);
      else if (data.action === 'changeVolume') stageContext.changeVolume(data.args[0], spriteId);
      else if (data.action === 'getVolume') result = stageContext.getVolume(spriteId);
      // Visibilidade & Tamanho
      else if (data.action === 'setSize') await setSize(data.args[0], spriteId);
      else if (data.action === 'changeSize') await changeSize(data.args[0], spriteId);
      else if (data.action === 'show') await show(spriteId);
      else if (data.action === 'hide') await hide(spriteId);
      // Aprendizado de Máquina (IA)
      else if (data.action === 'openMLWindow') setIsRecognitionWindowOpen(true);
      else if (data.action === 'closeMLWindow') setIsRecognitionWindowOpen(false);
      else if (data.action === 'setVideoOnStage') {
        // Propagado via evento customizado — a janela de ML escuta este evento
        window.dispatchEvent(new CustomEvent('stage-video-state', { detail: { state: data.args[0] } }));
      } else if (data.action === 'setVideoTransparency') {
        window.dispatchEvent(new CustomEvent('stage-video-transparency', { detail: { pct: data.args[0] } }));
      }

      // Monitores (show/hide/update via sandbox)
      else if (data.action === 'showMonitor') {
        const [monitorId, label, items] = data.args;
        const isListMonitor = (monitorId || '').startsWith('list_');
        setMonitorVisibility(monitorId, true, {
          label: label || monitorId,
          type: isListMonitor ? 'list' : 'variable',
          color: '#FF8C1A',
          spriteId: 'stage',
        });
        if (isListMonitor && items && items.length > 0) {
          updateMonitorItems(monitorId, items);
        }
      } else if (data.action === 'hideMonitor') {
        const [monitorId] = data.args;
        setMonitorVisibility(monitorId, false);
      } else if (data.action === 'updateListMonitor') {
        const [monitorId, items] = data.args;
        updateMonitorItems(monitorId, items || []);
      } else if (data.action === 'updateVarMonitor') {
        const [monitorId, value] = data.args;
        updateMonitorValue(monitorId, value);
      } else if (data.action === 'registerKeyListener') {
        const key = data.args[0];
        registerKeyListener(key, async () => {
          const executor = executorsRef.current.get(spriteId);
          if (executor && executor.iframe?.contentWindow) {
            executor.iframe.contentWindow.postMessage({ type: 'KEY_PRESSED', key }, '*');
          }
        });
      }

      // Responde: "Feito!"
      if (event.source) {
        (event.source as Window).postMessage(
          {
            type: 'ACTION_DONE',
            requestId: data.requestId,
            result,
          },
          '*',
        );
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (event.source) {
        (event.source as Window).postMessage(
          {
            type: 'ACTION_DONE',
            requestId: data.requestId,
            error: errorMessage,
          },
          '*',
        );
      }
    }
  };

  // Este useEffect RODA UMA VEZ SÓ, mantendo o listener intacto durante toda a vida do hook e invocando a closure da ref perfeitamente
  useEffect(() => {
    const globalMessageHandler = (event: MessageEvent) => {
      if (handleMessageRef.current) {
        handleMessageRef.current(event);
      }
    };

    window.addEventListener('message', globalMessageHandler);
    return () => window.removeEventListener('message', globalMessageHandler);
  }, []);

  // --- 2. FUNÇÃO DE EXECUÇÃO ---
  const executeInSandbox = useCallback((spriteId: string, code: string, hatId?: string) => {
    let executor = executorsRef.current.get(spriteId);
    if (!executor) {
      executor = new CodeExecutor(spriteId);
      executorsRef.current.set(spriteId, executor);
    }
    console.log(`[useSandboxExecutor] Rodando código para o sprite ${spriteId}${hatId ? ` (Hat: ${hatId})` : ''}`);
    return executor.run(code, hatId);
  }, []);

  // --- 3. INJEÇÃO CONTÍNUA DE DADOS DE ML ---
  useEffect(() => {
    const handlePredictions = (e: Event) => {
      const predictions = (e as CustomEvent).detail as { label: string; value: number }[];
      if (!predictions || predictions.length === 0) return;

      const confidences: Record<string, number> = {};
      let topClass = '';
      let topValue = -1;

      for (const p of predictions) {
        confidences[p.label] = p.value;
        if (p.value > topValue) {
          topValue = p.value;
          topClass = p.label;
        }
      }

      executorsRef.current.forEach((executor) => {
        if (executor.iframe?.contentWindow) {
          executor.iframe.contentWindow.postMessage(
            {
              type: 'UPDATE_ML_STATE',
              confidences,
              topClass,
            },
            '*',
          );
        }
      });
    };

    window.addEventListener('ml-predictions-update', handlePredictions);
    return () => window.removeEventListener('ml-predictions-update', handlePredictions);
  }, []);

  // --- 4. SINCRONIZAÇÃO DE SENSORES E ESTADO (Polling de alta frequência) ---
  useEffect(() => {
    let rafId: number;

    const syncSenses = () => {
      const globalState = getSensingState();
      const backdrops = stageContext.backdrops || [];
      const activeBackdropId = stageContext.activeBackdropId;
      const backdropIndex = backdrops.findIndex((b) => b.id === activeBackdropId);
      const backdropNumber = backdropIndex + 1;
      const backdropName = backdrops[backdropIndex]?.name || '';

      executorsRef.current.forEach((executor, spriteId) => {
        if (executor.iframe?.contentWindow) {
          // Busca dados específicos deste sprite
          const sprite = sprites.find((s) => s.id === spriteId);
          const costumeIndex = sprite ? sprite.costumes.findIndex((c) => c.id === sprite.currentCostumeId) : -1;

          const fullState = {
            ...globalState,
            spriteSize: sprite?.size || 100,
            costumeNumber: costumeIndex + 1,
            costumeName: sprite?.costumes[costumeIndex]?.name || '',
            backdropNumber,
            backdropName,
          };

          executor.iframe.contentWindow.postMessage(fullState, '*');
        }
      });

      rafId = requestAnimationFrame(syncSenses);
    };

    rafId = requestAnimationFrame(syncSenses);
    return () => cancelAnimationFrame(rafId);
  }, [getSensingState, sprites, stageContext.backdrops, stageContext.activeBackdropId]);

  // --- 4. LIMPEZA ---
  const stopExecutors = useCallback(() => {
    executorsRef.current.forEach((ex) => ex.dispose());
    executorsRef.current.clear();
    clearKeyListeners();
  }, [clearKeyListeners]);

  const stopExecutor = useCallback((spriteId: string) => {
    const executor = executorsRef.current.get(spriteId);
    if (executor) {
      executor.dispose();
      executorsRef.current.delete(spriteId);
    }
  }, []);

  useEffect(() => {
    return () => {
      // Não chamamos stopExecutors diretamente aqui para evitar problemas,
      // mas mantemos a lógica estável.
    };
  }, []);

  return useMemo(() => ({ executeInSandbox, stopExecutors, stopExecutor }), [executeInSandbox, stopExecutors, stopExecutor]);
}
