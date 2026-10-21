/**
 * useCodeExecution - Orquestrador de alto nível da execução de projetos.
 *
 * Responsabilidade: Coordenar o disparo global de execuções (Green Flag),
 * gerenciar o ciclo de vida dos sandboxes e validar pré-requisitos operacionais
 * (como conexão de hardware ou modelos de IA) antes do processamento.
 *
 * Operações Principais:
 * - handleRun/handleStop: Gatilhos mestres de controle da simulação concorrente.
 * - executeSpriteCode: Orquestração do isolamento de execução por ator.
 */
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { javascriptGenerator } from 'blockly/javascript';
import * as Blockly from 'blockly/core';
import { useExecutionRunner } from '../../context/RuntimeContext';
import { useProject } from '../../context/ProjectContext';
import { useSandboxExecutor } from './useSandboxExecutor';
import { HeadlessBlocklyRunner } from '../../lib/HeadlessBlocklyRunner';
import { BlocklyWorkspaceRef } from '../../domain/entities/IBlockly';
import { useFirmware } from '../../context/FirmwareContext';
import { useUI } from '../../context/UIContext';
import { ExecutionTask } from '../../domain/entities';
import { getExecutionEngine } from '@/_base/services/code/ExecutionEngine';
import { getProjectService } from '@/_base/services/code';
import { getPicoVM } from '../../vm/PicoVM';
import { useKeyboardInput } from './useKeyboardInput';

export function useCodeExecution(blocklyRef: React.RefObject<BlocklyWorkspaceRef | null>) {
  // Inicializa a VM para depuração global
  getPicoVM();

  const stageContext = useExecutionRunner();
  const { sprites, activeSpriteId } = useProject();
  const { executeInSandbox, stopExecutors } = useSandboxExecutor();
  const { isSerialConnected } = useFirmware();
  const { setShowBoardConnectionWarning } = useUI();
  const { start, stop, setForceExecution, incrementActiveCode, decrementActiveCode, isRunning } = stageContext;

  // --- NÚCLEO DE EXECUÇÃO ---
  const executeSpriteCode = useCallback(
    async (spriteId: string, code: string, origin: ExecutionTask['origin'] = 'green-flag', message?: string, hatId?: string) => {
      if (!code || !code.trim()) return;

      const engine = getExecutionEngine();

      // REGISTRO PROFISSIONAL:
      // Criamos uma tarefa no motor central antes de disparar o sandbox.
      const taskId = engine.registerTask(spriteId, origin, message);

      if (setForceExecution) setForceExecution(true);
      if (incrementActiveCode) incrementActiveCode();

      console.log(`[Executing] Sprite: ${spriteId}, Origin: ${origin}, Code:\n${code}`);

      const blockId = hatId?.split('_').pop();
      if (blockId && blocklyRef.current?.setBlockHighlight) {
        blocklyRef.current.setBlockHighlight(blockId, true);
      }

      try {
        // ISOLAMENTO DE EXECUÇÃO:
        // Cada ator roda em seu próprio Sandbox Worker.
        // Passamos o hatId para permitir preempção (reinício) de scripts específicos.
        await executeInSandbox(spriteId, code, hatId);
      } catch (e) {
        console.error(`[ExecutionEngine] Erro na tarefa ${taskId} (Sprite ${spriteId}):`, e);
      } finally {
        // FINALIZAÇÃO:
        // Informamos ao motor que esta tarefa específica acabou.
        engine.completeTask(taskId);

        if (blockId && blocklyRef.current?.setBlockHighlight) {
          blocklyRef.current.setBlockHighlight(blockId, false);
        }

        if (setForceExecution) setForceExecution(false);
        if (decrementActiveCode) decrementActiveCode();
      }
    },
    [setForceExecution, incrementActiveCode, decrementActiveCode, executeInSandbox],
  );

  // --- HANDLERS (TRATADORES DE EVENTOS) ---
  // Registra os listeners globais de teclado para o motor de execução (Sandbox path)
  useKeyboardInput(blocklyRef, executeSpriteCode);

  const handleRun = useCallback(async () => {
    const engine = getExecutionEngine();

    // Lógica de reinício
    if (isRunning) {
      engine.stop();
      if (stopExecutors) stopExecutors();
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    engine.start();
    start();

    // 1. Força execução para o setup
    if (setForceExecution) setForceExecution(true);

    try {
      const executionPromises: Promise<void>[] = [];

      for (const sprite of sprites) {
        let codeToRun = '';

        if (sprite.id === activeSpriteId) {
          if (blocklyRef.current && blocklyRef.current.checkGreenFlagEvents) {
            const activeCode = blocklyRef.current.checkGreenFlagEvents();
            if (activeCode) codeToRun = activeCode;
          }
        } else {
          if (sprite.blocks) {
            codeToRun = HeadlessBlocklyRunner.getGreenFlagCode(sprite.blocks);
          }
        }

        if (codeToRun) {
          if (codeToRun.includes('stage.board.') && !isSerialConnected) {
            setShowBoardConnectionWarning(true);
            engine.stop();
            stop();
            if (setForceExecution) setForceExecution(false);
            return;
          }

          executionPromises.push(executeSpriteCode(sprite.id, codeToRun, 'green-flag'));
        }
      }

      if (executionPromises.length > 0) {
        await Promise.all(executionPromises);
      }
    } catch (e) {
      console.warn('Erro no handleRun:', e);
    } finally {
      if (setForceExecution) setForceExecution(false);
    }
  }, [
    isRunning,
    stop,
    start,
    setForceExecution,
    stopExecutors,
    sprites,
    activeSpriteId,
    blocklyRef,
    isSerialConnected,
    setShowBoardConnectionWarning,
    executeSpriteCode,
  ]);

  const handleStop = useCallback(() => {
    const engine = getExecutionEngine();
    engine.stop();
    stop(true);
    if (stopExecutors) stopExecutors();
  }, [stop, stopExecutors]);

  const handleBlockClick = useCallback(
    async (blockId: string) => {
      if (!blocklyRef.current) return;

      const code = blocklyRef.current.generateCodeForBlock(blockId);
      if (!code) return;

      if (code.includes('stage.board.') && !isSerialConnected) {
        setShowBoardConnectionWarning(true);
        return;
      }

      await executeSpriteCode(activeSpriteId, code);
    },
    [blocklyRef, activeSpriteId, executeSpriteCode, isSerialConnected, setShowBoardConnectionWarning],
  );

  const handleRunCode = useCallback(
    async (blockId: string, workspaceId: string) => {
      const ws = blocklyRef.current?.getWorkspace();
      if (!ws) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flyout = (ws as any).getFlyout?.() || (ws as any).getToolbox?.()?.getFlyout?.();
      const flyoutWs = flyout?.getWorkspace?.() as Blockly.Workspace | null;
      if (!flyoutWs || flyoutWs.id !== workspaceId) return;

      const block = flyoutWs.getBlockById(blockId);
      if (!block || !block.isEnabled()) return;

      try {
        const gen = javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void };
        if (gen.init) gen.init(flyoutWs);
        const codeOrTuple = javascriptGenerator.blockToCode(block);
        // Reporter blocks return [code, order] — wrap in console.log to make it a statement
        const code = Array.isArray(codeOrTuple) ? `console.log(${codeOrTuple[0]});` : String(codeOrTuple);
        if (code.trim()) {
          await executeSpriteCode(activeSpriteId, code);
        }
      } catch (e) {
        console.warn('[handleRunCode] Erro ao gerar/executar código do flyout:', e);
      }
    },
    [activeSpriteId, blocklyRef, executeSpriteCode],
  );

  // --- ML WHEN PREDICTED: Listener contínuo ---
  const mlCooldownRef = useRef<Record<string, number>>({});
  const mlRunningRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handler = (e: Event) => {
      const predictions = (e as CustomEvent).detail as { label: string; value: number }[];
      if (!predictions || !blocklyRef.current) return;

      for (const pred of predictions) {
        if (pred.value >= 80) {
          const now = Date.now();
          const scripts = blocklyRef.current.checkMLPredictionEvents(pred.label);
          if (scripts) {
            mlCooldownRef.current[pred.label] = now;

            // DISPARO ASÍNCRONO:
            // Executamos cada script vinculado ao label de ML.
            // O sistema de preempção do motor cuidará de reiniciar scripts
            // se a mesma classe for detectada novamente.
            scripts.forEach((s) => {
              executeSpriteCode(activeSpriteId, s.code, 'broadcast', pred.label, s.hatId);
            });
          }
        }
      }
    };

    window.addEventListener('ml-predictions-update', handler);
    return () => window.removeEventListener('ml-predictions-update', handler);
  }, [blocklyRef, stageContext.isRunning, activeSpriteId, executeSpriteCode]);

  // --- BROADCAST (MENSAGENS): Orquestrador Global ---
  useEffect(() => {
    const projectService = getProjectService();

    const handleBroadcast = async (message: string) => {
      console.log(`[useCodeExecution] Recebido broadcast: ${message}`);
      const executionPromises: Promise<void>[] = [];

      for (const sprite of sprites) {
        const codeToRun = '';

        if (sprite.id === activeSpriteId) {
          // Sprite Ativo: Usa o detector do Hook (que tem acesso ao workspace vivo)
          if (blocklyRef.current && blocklyRef.current.checkMessageEvents) {
            const scripts = blocklyRef.current.checkMessageEvents(message);
            if (scripts) {
              scripts.forEach((s) => {
                executionPromises.push(executeSpriteCode(sprite.id, s.code, 'broadcast', message, s.hatId));
              });
            }
          }
        } else {
          // Outros Sprites: Usa o Runner Headless (processamento em segundo plano)
          if (sprite.blocks) {
            const scripts = HeadlessBlocklyRunner.getMessageCode(sprite.blocks, message);
            if (scripts) {
              scripts.forEach((s) => {
                executionPromises.push(executeSpriteCode(sprite.id, s.code, 'broadcast', message, s.hatId));
              });
            }
          }
        }
      }

      // Aguarda a conclusão de TODOS os scripts disparados por esta mensagem
      if (executionPromises.length > 0) {
        await Promise.all(executionPromises);
      }

      // Notifica o service que a transmissão terminou (essencial para o 'broadcast and wait')
      projectService.emit('broadcastDone', message);
    };

    const handleBackdropChange = async (backdropName: string) => {
      console.log(`[useCodeExecution] Cenário mudou para: ${backdropName}`);
      const executionPromises: Promise<void>[] = [];

      for (const sprite of sprites) {
        const codeToRun = '';

        if (sprite.id === activeSpriteId) {
          if (blocklyRef.current && blocklyRef.current.checkBackdropEvents) {
            const scripts = blocklyRef.current.checkBackdropEvents(backdropName);
            if (scripts) {
              scripts.forEach((s: { code: string; hatId: string }) => {
                executionPromises.push(executeSpriteCode(sprite.id, s.code, 'broadcast', backdropName, s.hatId));
              });
            }
          }
        } else {
          if (sprite.blocks) {
            const scripts = HeadlessBlocklyRunner.getBackdropCode(sprite.blocks, backdropName);
            if (scripts) {
              scripts.forEach((s: { code: string; hatId: string }) => {
                executionPromises.push(executeSpriteCode(sprite.id, s.code, 'broadcast', backdropName, s.hatId));
              });
            }
          }
        }
      }

      if (executionPromises.length > 0) {
        await Promise.all(executionPromises);
      }

      projectService.emit('backdropDone', backdropName);
    };

    projectService.on('broadcast', handleBroadcast);
    projectService.on('activeBackdropChange', handleBackdropChange);

    // --- CLONE LISTENER ---
    const handleSpriteCloned = (e: Event) => {
      const { spriteId } = (e as CustomEvent).detail;
      const sprite = sprites.find((s) => s.id === spriteId);
      if (sprite && sprite.blocks) {
        const scripts = HeadlessBlocklyRunner.getCloneCode(sprite.blocks);
        if (scripts) {
          scripts.forEach((s: { code: string; hatId: string }) => {
            executeSpriteCode(spriteId, s.code, 'broadcast', 'clone', s.hatId);
          });
        }
      }
    };

    // --- CLICK LISTENERS ---
    const handleStageClicked = () => {
      console.log('[useCodeExecution] Palco clicado!');

      // Tenta o workspace vivo primeiro (se o palco estiver selecionado)
      if (activeSpriteId === 'stage' && blocklyRef.current?.checkStageClickEvents) {
        const scripts = blocklyRef.current.checkStageClickEvents();
        if (scripts) {
          scripts.forEach((s: { code: string; hatId: string }) => executeSpriteCode('stage', s.code, 'broadcast', 'click', s.hatId));
        }
      } else {
        // Senão usa Headless
        const scripts = HeadlessBlocklyRunner.getStageClickCode(projectService.getStageBlocks().blocks || null);
        if (scripts) {
          scripts.forEach((s: { code: string; hatId: string }) => executeSpriteCode('stage', s.code, 'broadcast', 'click', s.hatId));
        }
      }
    };

    const handleSpriteClicked = (e: Event) => {
      const { spriteId } = (e as CustomEvent).detail;
      console.log(`[useCodeExecution] Ator clicado: ${spriteId}`);

      if (activeSpriteId === spriteId && blocklyRef.current?.checkSpriteClickEvents) {
        const scripts = blocklyRef.current.checkSpriteClickEvents(spriteId);
        if (scripts) {
          scripts.forEach((s: { code: string; hatId: string }) => executeSpriteCode(spriteId, s.code, 'broadcast', 'click', s.hatId));
        }
      } else {
        const sprite = sprites.find((s) => s.id === spriteId);
        if (sprite && sprite.blocks) {
          const scripts = HeadlessBlocklyRunner.getSpriteClickCode(sprite.blocks);
          if (scripts) {
            scripts.forEach((s: { code: string; hatId: string }) => executeSpriteCode(spriteId, s.code, 'broadcast', 'click', s.hatId));
          }
        }
      }
    };

    window.addEventListener('sprite-cloned', handleSpriteCloned);
    window.addEventListener('stage-clicked', handleStageClicked);
    window.addEventListener('sprite-clicked', handleSpriteClicked);

    return () => {
      projectService.off('broadcast', handleBroadcast);
      projectService.off('activeBackdropChange', handleBackdropChange);
      window.removeEventListener('sprite-cloned', handleSpriteCloned);
      window.removeEventListener('stage-clicked', handleStageClicked);
      window.removeEventListener('sprite-clicked', handleSpriteClicked);
    };
  }, [sprites, activeSpriteId, blocklyRef, executeSpriteCode]);

  // --- SINCRONIZAÇÃO GLOBAL DE AUTO-STOP (MOTOR) ---
  useEffect(() => {
    const engine = getExecutionEngine();

    const onEngineStop = () => {
      console.log('[useCodeExecution] Motor sinalizou parada global.');
      stop(false);
    };

    engine.on('engine:stop', onEngineStop);
    return () => {
      engine.off('engine:stop', onEngineStop);
    };
  }, [stop]);

  return useMemo(
    () => ({
      executeSpriteCode,
      handleRun,
      handleStop,
      handleBlockClick,
      handleRunCode,
    }),
    [executeSpriteCode, handleRun, handleStop, handleBlockClick, handleRunCode],
  );
}
