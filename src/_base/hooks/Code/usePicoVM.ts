/**
 * usePicoVM - Hook React que conecta a PicoVM ao sistema existente.
 *
 * Responsabilidades:
 * - Injeta runner, workspace e sprites na VM a cada render
 * - Expõe handleRun / handleStop / handleBlockClick compatíveis com useCodeExecution
 * - Redireciona broadcasts internamente para a VM (sem passar pelo sandbox)
 * - Escuta teclas, cenários, clones e cliques → dispara threads na VM
 * - Expõe API de debug (pause, resume, step, enableDebug, disableDebug)
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useExecutionRunner } from '../../context/RuntimeContext';
import { useProject } from '../../context/ProjectContext';
import { useFirmware } from '../../context/FirmwareContext';
import { useUI } from '../../context/UIContext';
import { getPicoVM } from '../../vm/PicoVM';
import { VMRunnerMethods } from '../../vm/types';
import { BlocklyWorkspaceRef } from '../../domain/entities/IBlockly';
import { getProjectService } from '@/_base/services/code';
import { getExecutionEngine } from '@/_base/services/code/ExecutionEngine';

export function usePicoVM(blocklyRef: React.RefObject<BlocklyWorkspaceRef | null>) {
  const runner = useExecutionRunner();
  const { sprites, activeSpriteId, backdrops, activeBackdropId, setMonitorVisibility, updateMonitorItems } = useProject();
  const { isSerialConnected, board } = useFirmware();
  const { setShowBoardConnectionWarning, isUploadMode } = useUI();

  const vm = getPicoVM();

  const activeSpriteIdRef = useRef(activeSpriteId);
  activeSpriteIdRef.current = activeSpriteId;

  // Refs para state readers — evitam recriar vmRunner a cada render de sprites/backdrops
  const spritesRef = useRef(sprites);
  spritesRef.current = sprites;
  const backdropsRef = useRef(backdrops);
  backdropsRef.current = backdrops;
  const activeBackdropIdRef = useRef(activeBackdropId);
  activeBackdropIdRef.current = activeBackdropId;
  const isUploadModeRef = useRef(isUploadMode);
  isUploadModeRef.current = isUploadMode;

  // ─────────────────────────────────────────────────────────
  // Highlight callback — chama setBlockHighlight no workspace visível
  // ─────────────────────────────────────────────────────────
  const onHighlight = useCallback(
    (blockId: string, on: boolean) => {
      blocklyRef.current?.setBlockHighlight(blockId, on);
    },
    [blocklyRef],
  );

  // ─────────────────────────────────────────────────────────
  // VMRunnerMethods — agrega runner + board + state readers
  // Broadcast redirecionado para VM (sem passar pelo sandbox)
  // ─────────────────────────────────────────────────────────
  const vmRunner = useMemo<VMRunnerMethods>(
    () => ({
      // Motion
      move: (s, id) => runner.move(s, id),
      turn: (d, id) => runner.turn(d, id),
      goTo: (x, y, id) => runner.goTo(x, y, id),
      setX: (x, id) => runner.setX(x, id),
      setY: (y, id) => runner.setY(y, id),
      addX: (dx, id) => runner.addX(dx, id),
      addY: (dy, id) => runner.addY(dy, id),
      setAngle: (d, id) => runner.setAngle(d, id),
      setRotationStyle: (s, id) => runner.setRotationStyle(s as 'all around' | 'left-right' | "don't rotate", id),
      glide: (s, x, y, id) => runner.glide(s, x, y, id),
      bounceOnEdge: (id) => runner.bounceOnEdge(id),
      goToMouse: (id) => runner.goToMouse(id),
      pointToMouse: (id) => runner.pointToMouse(id),

      // Looks
      say: (t, id) => runner.say(t, id),
      sayFor: (t, s, id) => runner.sayFor(t, s, id),
      think: (t, id) => runner.think(t, id),
      thinkFor: (t, s, id) => runner.thinkFor(t, s, id),
      switchCostume: (c, id) => runner.switchCostume(c, id),
      setSize: (s, id) => runner.setSize(s, id),
      changeSize: (d, id) => runner.changeSize(d, id),
      show: (id) => runner.show(id),
      hide: (id) => runner.hide(id),
      setEffect: (e, v, id) => runner.setEffect(e, v, id),
      changeEffect: (e, d, id) => runner.changeEffect(e, d, id),
      clearEffects: (id) => runner.clearEffects(id),
      goToLayer: (l, id) => runner.goToLayer(l, id),
      goForwardLayers: (n, id) => runner.goForwardLayers(n, id),
      switchBackdrop: (b) => runner.switchBackdrop(b),
      switchBackdropAndWait: (b) => runner.switchBackdropAndWait(b),

      // Sound
      playSound: (n, id) => runner.playSound(n, id),
      playSoundUntilDone: (n, id) => runner.playSoundUntilDone(n, id),
      stopAllSounds: () => runner.stopAllSounds(),
      setSoundEffect: (e, v, id) => runner.setSoundEffect(e, v, id),
      changeSoundEffect: (e, d, id) => runner.changeSoundEffect(e, d, id),
      clearSoundEffects: (id) => runner.clearSoundEffects(id),
      setVolume: (v, id) => runner.setVolume(v, id),
      changeVolume: (d, id) => runner.changeVolume(d, id),
      getVolume: (id) => runner.getVolume(id),

      // Control — broadcast vai direto para a VM
      wait: (s) => runner.wait(s),
      broadcast: (msg) => vm.triggerBroadcast(msg, false),
      broadcastAndWait: (msg) => vm.triggerBroadcast(msg, true),
      createClone: (t, caller) => runner.createClone(t, caller),
      deleteClone: (t) => runner.deleteClone(t),

      // Sensing
      getSensingState: () => runner.getSensingState(),
      isTouching: (id, t) => runner.isTouching(id, t),
      touchingColor: (h, id) => runner.touchingColor(h, id),
      colorTouchingColor: (h1, h2, id) => runner.colorTouchingColor(h1, h2, id),
      getDistanceTo: (id, t) => runner.getDistanceTo(id, t),
      resetTimer: () => runner.resetTimer(),
      askAndWait: (q, id) => runner.askAndWait(q, id),
      getSpriteProperty: (t, p) => runner.getSpriteProperty(t, p),
      setDraggable: (d, id) => runner.setDraggable(d, id),


      // State readers — leem diretamente do ProjectService (fonte de verdade)
      // IMPORTANTE: NÃO usar spritesRef.current aqui. O React state é sincronizado
      // a 30fps via RAF heartbeat (até 33ms de lag). Ao ler de getProjectService()
      // diretamente, garantimos que sprite.blocks dos sprites inativos sempre
      // reflita o último save do handleBlocklyEvents, evitando que scripts não
      // executem por estado desatualizado.
      getSprites: () => {
        const ps = getProjectService();
        const currentSprites = [...ps.getSprites()];

        // Se o palco não estiver na lista, adicionamos um objeto virtual dele
        // Isso permite que a VM encontre blocos do palco para eventos (clique, flag, broadcast)
        if (!currentSprites.find((s) => s.id === 'stage')) {
          const stageBlocks = ps.getStageBlocks();
          const activeBackdrop = backdropsRef.current.find((b) => b.id === activeBackdropIdRef.current) || backdropsRef.current[0];

          currentSprites.push({
            id: 'stage',
            name: 'Palco',
            isStage: true,
            blocks: stageBlocks.blocks,
            code: stageBlocks.code,
            costumes: backdropsRef.current as any,
            currentCostumeId: activeBackdropIdRef.current,
            costume: activeBackdrop?.url || '',
            sounds: activeBackdrop?.sounds || [],
            currentSoundId: activeBackdrop?.currentSoundId || null,
            x: 0,
            y: 0,
            angle: 90,
            size: 100,
            visible: true,
            volume: 100,
            rotationStyle: 'all around',
            bubbleText: '',
            bubbleType: null,
            soundEffects: {},
            variables: ps.getVariables('stage'),
          } as any);
        }

        return currentSprites;
      },
      getBackdrops: () => backdropsRef.current,
      getActiveBackdropId: () => activeBackdropIdRef.current,

      // Machine Learning
      openMLWindow: () => runner.openMLWindow(),
      closeMLWindow: () => runner.closeMLWindow(),
      isIdentifiedClass: (c) => runner.isIdentifiedClass(c),
      getIdentifiedClass: () => runner.getIdentifiedClass(),
      getConfidence: (c) => runner.getConfidence(c),

      // Monitors
      updateMonitorValue: (id, val) => runner.updateMonitorValue?.(id, val),
      updateMonitorItems: (id, items) => updateMonitorItems(id, items),
      setMonitorVisible: (monitorId: string, label: string, visible: boolean) => {
        // Detecta se é um monitor de lista (prefixo 'list_')
        const isListMonitor = monitorId.startsWith('list_');
        setMonitorVisibility(monitorId, visible, {
          label,
          type: isListMonitor ? 'list' : 'variable',
          color: isListMonitor ? '#FF8C1A' : '#FF8C1A',
          spriteId: 'stage',
        });
      },

      // Runtime lifecycle
      clearClones: () => getProjectService().clearClones(),

      // Debugging
      debugMode: vm.debugMode,

      // State writers — sincronizam runtime da VM com o ProjectService persistente
      isUploadMode: isUploadModeRef.current,
      updateVariableValueById: (id, val) => {
        const mode = isUploadModeRef.current ? 'upload' : 'stage';
        getProjectService().updateVariableValueById(mode, id, val);
      },
      updateListItemsById: (id, items) => {
        const mode = isUploadModeRef.current ? 'upload' : 'stage';
        getProjectService().updateListItemsById(mode, id, items);
      },

      // Hardware board
      board: board ?? null,
    }),
    [runner, vm, board, setMonitorVisibility, updateMonitorItems],
  ); // sprites/backdrops/activeBackdropId removidos: lidos via ref

  // ─────────────────────────────────────────────────────────
  // Configura a VM sempre que as dependências mudam
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Injetamos globalmente para depuração via console
    if (typeof window !== 'undefined') {
      (window as any).__PICO_VM__ = vm;
    }

    vm.configure({
      runner: vmRunner,
      getActiveWorkspace: () => blocklyRef.current?.getWorkspace() ?? null,
      getActiveSpriteId: () => activeSpriteIdRef.current,
      onHighlight,
    });
  }, [vm, vmRunner, blocklyRef, onHighlight]);

  // ─────────────────────────────────────────────────────────
  // Escuta teclas → vm.triggerKeyPress
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      vm.triggerKeyPress(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [vm]);

  // ─────────────────────────────────────────────────────────
  // Escuta mudança de cenário → vm.triggerBackdropChange
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const ps = getProjectService();
    const onBackdrop = (name: string) => {
      if (!getExecutionEngine().isProjectRunning()) return;
      vm.triggerBackdropChange(name);
    };
    ps.on('activeBackdropChange', onBackdrop);
    return () => ps.off('activeBackdropChange', onBackdrop);
  }, [vm]);

  // ─────────────────────────────────────────────────────────
  // Escuta criação de clone → vm.triggerCloneStart
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onClone = (e: Event) => {
      const { spriteId } = (e as CustomEvent<{ spriteId: string }>).detail;
      // Usamos o ProjectService diretamente para evitar closures obsoletas (stale closures) do React
      // O estado do service é atualizado sincronicamente, enquanto o estado do React é assíncrono.
      const sprite = getProjectService().getSpriteById(spriteId);
      if (sprite?.blocks) {
        vm.triggerCloneStart(spriteId, sprite.blocks);
      }
    };
    window.addEventListener('sprite-cloned', onClone);
    return () => window.removeEventListener('sprite-cloned', onClone);
  }, [vm]);

  // ─────────────────────────────────────────────────────────
  // Escuta clique no palco → vm.triggerSpriteClick('stage')
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onStageClick = () => {
      if (!getExecutionEngine().isProjectRunning()) {
        getExecutionEngine().start();
      }
      vm.triggerSpriteClick('stage');
    };
    window.addEventListener('stage-clicked', onStageClick);
    return () => window.removeEventListener('stage-clicked', onStageClick);
  }, [vm]);

  // ─────────────────────────────────────────────────────────
  // Escuta clique em sprite → vm.triggerSpriteClick(id)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onSpriteClick = (e: Event) => {
      if (!getExecutionEngine().isProjectRunning()) {
        getExecutionEngine().start();
      }
      const spriteId = (e as CustomEvent<{ spriteId: string }>).detail?.spriteId;
      if (spriteId) vm.triggerSpriteClick(spriteId);
    };
    window.addEventListener('sprite-clicked', onSpriteClick);
    return () => window.removeEventListener('sprite-clicked', onSpriteClick);
  }, [vm]);

  // ─────────────────────────────────────────────────────────
  // Escuta previsões de ML → vm.triggerMLPrediction
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onPredictions = (e: Event) => {
      if (!getExecutionEngine().isProjectRunning()) return;
      const predictions = (e as CustomEvent).detail as { label: string; value: number }[];
      if (!predictions) return;

      for (const pred of predictions) {
        if (pred.value >= 80) {
          vm.triggerMLPrediction(pred.label);
        }
      }
    };
    window.addEventListener('ml-predictions-update', onPredictions);
    return () => window.removeEventListener('ml-predictions-update', onPredictions);
  }, [vm]);

  // ─────────────────────────────────────────────────────────
  // API pública — Execução
  // ─────────────────────────────────────────────────────────

  const handleRun = useCallback(async () => {
    const engine = getExecutionEngine();

    if (engine.isProjectRunning()) {
      vm.stopAll();
      runner.stop(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Verifica se precisa de hardware e não está conectado
    const ws = blocklyRef.current?.getWorkspace();
    if (ws) {
      const blocks = ws.getTopBlocks(false);
      const needsBoard = blocks.some((b) => {
        const next = b.getNextBlock();
        return next?.type?.startsWith('board_') || next?.type?.startsWith('set_digital') || next?.type?.startsWith('set_pwm');
      });
      if (needsBoard && !isSerialConnected) {
        setShowBoardConnectionWarning(true);
        return;
      }
    }

    // Garante que o workspace ativo está salvo no ProjectService antes de coletar
    // blocos de todos os sprites. Cobre a janela de 450ms de transição de sprite,
    // onde activeSpriteId já mudou mas o workspace ainda não foi recarregado.
    blocklyRef.current?.flushActiveWorkspace();

    runner.start();
    vm.greenFlag();
  }, [vm, runner, blocklyRef, isSerialConnected, setShowBoardConnectionWarning]);

  const handleStop = useCallback(() => {
    vm.stopAll();
    runner.stop(true);
  }, [vm, runner]);

  /** Clique em bloco no workspace principal — executa via VM */
  const handleBlockClick = useCallback(
    (blockId: string) => {
      // Força sincronia do workspace visual para o registry antes de rodar
      blocklyRef.current?.flushActiveWorkspace();

      runner.start();
      vm.runBlockById(blockId, activeSpriteId);
    },
    [vm, runner, activeSpriteId, blocklyRef],
  );

  /** Clique em bloco no flyout — executa via VM usando o bloco do flyout */
  const handleRunCode = useCallback(
    (blockId: string, workspaceId: string) => {
      const ws = blocklyRef.current?.getWorkspace();
      if (!ws) return;

      const flyout = ws.getFlyout() || (ws as any).getToolbox()?.getFlyout();
      const flyoutWs = flyout?.getWorkspace();

      if (flyoutWs && flyoutWs.id === workspaceId) {
        runner.start();
        vm.runBlockById(blockId, activeSpriteId, flyoutWs);
      }
    },
    [vm, runner, activeSpriteId, blocklyRef],
  );

  // ─────────────────────────────────────────────────────────
  // API pública — Debug
  // ─────────────────────────────────────────────────────────

  const enableDebug = useCallback(() => vm.enableDebug(), [vm]);
  const disableDebug = useCallback(() => vm.disableDebug(), [vm]);
  const pauseVM = useCallback(() => vm.pause(), [vm]);
  const resumeVM = useCallback(() => vm.resume(), [vm]);
  const stepVM = useCallback(() => vm.step(), [vm]);

  return {
    // Execução
    handleRun,
    handleStop,
    handleBlockClick,
    handleRunCode,
    // Debug
    enableDebug,
    disableDebug,
    pauseVM,
    resumeVM,
    stepVM,
    get isDebugMode() {
      return vm.debugMode;
    },
    get isVMPaused() {
      return vm.isPaused;
    },
  };
}
