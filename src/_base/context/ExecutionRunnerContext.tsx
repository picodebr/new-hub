/**
 * ExecutionRunnerContext - Motor de execução e gestão de fluxos concorrentes.
 *
 * Responsabilidade: Prover a infraestrutura necessária para rodar o código
 * gerado pelos blocos no Palco, gerenciando a pilha de threads de simulação,
 * controles de interrupção (Stop) e o sincronismo entre os atores visuais.
 */
'use client';

import React, { createContext, useContext, ReactNode, useState, useMemo, useCallback } from 'react';
import { useStageRunner } from '../hooks/Code/useStageRunner';
import { useSpriteManager } from '../hooks/Code/useSpriteManager';
import { IBlocklyWorkspaceJson, SpriteData, BackdropData, SpriteVariable, BlocklyWorkspaceRef, SensingState } from '../domain/entities';

export interface ExecutionRunnerContextType {
  isRunning: boolean;
  activeRunningCount: number;
  isAnyCodeRunning: boolean;
  start: () => void;
  stop: () => void;
  setForceExecution: (force: boolean) => void;
  incrementActiveCode: () => void;
  decrementActiveCode: () => void;

  // Sprites
  sprites: SpriteData[];
  activeSpriteId: string;
  setActiveSpriteId: (id: string) => void;
  setSprites: (newSprites: SpriteData[]) => void;
  deleteSprite: (id: string) => void;
  selectSprite: (id: string) => void;
  updateSpriteBlocks: (id: string, blocks: IBlocklyWorkspaceJson, code: string, variables?: SpriteVariable[]) => void;
  updateSpriteInfo: (id: string, changes: Partial<SpriteData>) => void;
  addSprite: (file?: File) => void;
  getSprite: () => SpriteData;
  getSpriteById: (id: string) => SpriteData | undefined;

  // Actions (Exposed to Runtime)
  move: (steps: number, targetId?: string) => Promise<void>;
  turn: (deg: number, targetId?: string) => Promise<void>;
  goTo: (x: number, y: number, targetId?: string) => void;
  goToMouse: (targetId?: string) => Promise<void>;
  pointToMouse: (targetId?: string) => Promise<void>;
  setX: (x: number, targetId?: string) => Promise<void>;
  setY: (y: number, targetId?: string) => Promise<void>;
  addX: (dx: number, targetId?: string) => Promise<void>;
  addY: (dy: number, targetId?: string) => Promise<void>;
  setAngle: (deg: number, targetId?: string) => void;
  say: (text: string | number, targetId?: string) => void;
  sayFor: (text: string | number, secs: number, targetId?: string) => Promise<void>;
  think: (text: string | number, targetId?: string) => void;
  thinkFor: (text: string | number, secs: number, targetId?: string) => Promise<void>;
  wait: (secs: number) => Promise<void>;
  bounceOnEdge: (targetId?: string) => Promise<void>;
  setSize: (size: number, targetId?: string) => Promise<void>;
  changeSize: (delta: number, targetId?: string) => Promise<void>;
  show: (targetId?: string) => Promise<void>;
  hide: (targetId?: string) => Promise<void>;
  registerKeyListener: (key: string, callback: () => Promise<void>) => void;
  clearKeyListeners: () => void;
  switchCostume: (costumeIdOrType: string, targetId?: string) => Promise<void>;
  broadcast: (message: string) => Promise<void>;
  broadcastAndWait: (message: string) => Promise<void>;

  // Sensors (StageRunner)
  getSensingState: () => SensingState;
  isTouching: (spriteId: string, target: string) => boolean;
  getDistanceTo: (spriteId: string, target: string) => number;
  resetTimer: () => void;
  askAndWait: (question: string, targetId?: string) => Promise<string>;
  activeQuestion: string | null;
  submitAsk: (answer: string) => void;

  // Backdrops
  backdropImage: string;
  activeBackdropId: string;
  backdrops: BackdropData[];
  addBackdrop: (file: File) => void;
  deleteBackdrop: (id: string) => void;
  selectBackdrop: (id: string) => void;
  switchBackdrop: (idOrType: string) => Promise<void>;
  setBackdrops: (newBackdrops: BackdropData[]) => void;
  setActiveBackdropId: (id: string) => void;

  // Blockly Workspace Sync
  blocklyWorkspaceRef: React.RefObject<BlocklyWorkspaceRef | null> | null;
  setBlocklyWorkspaceRef: (ref: React.RefObject<BlocklyWorkspaceRef | null>) => void;
}

const ExecutionRunnerContext = createContext<ExecutionRunnerContextType | null>(null);

export function ExecutionRunnerProvider({ children }: { children: ReactNode }) {
  const spritesManager = useSpriteManager();
  const runner = useStageRunner();

  const [blocklyWorkspaceRef, setBlocklyWorkspaceRef] = useState<React.RefObject<BlocklyWorkspaceRef | null> | null>(null);

  const currentBackdrop = spritesManager.backdrops.find((b: BackdropData) => b.id === spritesManager.activeBackdropId) || spritesManager.backdrops[0];
  const backdropImage = currentBackdrop?.url || '';

  const getSprite = useCallback(() => {
    return spritesManager.sprites.find((s: SpriteData) => s.id === spritesManager.activeSpriteId) || spritesManager.sprites[0];
  }, [spritesManager.sprites, spritesManager.activeSpriteId]);

  const getSpriteById = useCallback(
    (id: string) => {
      return spritesManager.sprites.find((s: SpriteData) => s.id === id);
    },
    [spritesManager.sprites],
  );

  const value: ExecutionRunnerContextType = useMemo(
    () => ({
      isRunning: runner.isRunning,
      activeRunningCount: runner.activeRunningCount,
      isAnyCodeRunning: runner.isRunning || runner.activeRunningCount > 0,
      start: runner.start,
      stop: runner.stop,
      setForceExecution: runner.setForceExecution,
      incrementActiveCode: runner.incrementActiveCode,
      decrementActiveCode: runner.decrementActiveCode,

      sprites: spritesManager.sprites,
      activeSpriteId: spritesManager.activeSpriteId,
      setActiveSpriteId: spritesManager.setActiveSpriteIdExternal,
      setSprites: spritesManager.setSpritesExternal,
      deleteSprite: spritesManager.deleteSprite,
      selectSprite: spritesManager.selectSprite,
      updateSpriteBlocks: spritesManager.updateSpriteBlocks,
      updateSpriteInfo: spritesManager.updateSpriteInfo,
      addSprite: spritesManager.addSprite,
      getSprite,
      getSpriteById,

      move: runner.move,
      turn: runner.turn,
      goTo: runner.goTo,
      goToMouse: runner.goToMouse,
      pointToMouse: runner.pointToMouse,
      setX: runner.setX,
      setY: runner.setY,
      addX: runner.addX,
      addY: runner.addY,
      setAngle: runner.setAngle,
      say: runner.say,
      sayFor: runner.sayFor,
      think: runner.think,
      thinkFor: runner.thinkFor,
      wait: runner.wait,
      bounceOnEdge: runner.bounceOnEdge,
      setSize: runner.setSize,
      changeSize: runner.changeSize,
      show: runner.show,
      hide: runner.hide,
      switchCostume: runner.switchCostume,
      registerKeyListener: runner.registerKeyListener,
      clearKeyListeners: runner.clearKeyListeners,
      broadcast: runner.broadcast,
      broadcastAndWait: runner.broadcastAndWait,

      // Sensors
      getSensingState: runner.getSensingState,
      isTouching: runner.isTouching,
      getDistanceTo: runner.getDistanceTo,
      resetTimer: runner.resetTimer,
      askAndWait: runner.askAndWait,
      activeQuestion: runner.activeQuestion,
      submitAsk: runner.submitAsk,

      backdropImage,
      activeBackdropId: spritesManager.activeBackdropId,
      backdrops: spritesManager.backdrops,
      addBackdrop: spritesManager.addBackdrop,
      deleteBackdrop: spritesManager.deleteBackdrop,
      selectBackdrop: spritesManager.selectBackdrop,
      switchBackdrop: spritesManager.switchBackdrop,
      setBackdrops: spritesManager.setBackdropsExternal,
      setActiveBackdropId: spritesManager.setActiveBackdropIdExternal,

      blocklyWorkspaceRef,
      setBlocklyWorkspaceRef,
    }),
    [runner, spritesManager, backdropImage, blocklyWorkspaceRef, getSprite, getSpriteById],
  );

  return <ExecutionRunnerContext.Provider value={value}>{children}</ExecutionRunnerContext.Provider>;
}

export function useExecutionRunner() {
  const context = useContext(ExecutionRunnerContext);
  if (!context) {
    throw new Error('useExecutionRunner must be used within an ExecutionRunnerProvider');
  }
  return context;
}
