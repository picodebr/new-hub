'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useMemo, useCallback } from 'react';

// Types & Entities
import {
  ISerialPort,
  IBlocklyWorkspaceJson,
  BlocklyWorkspaceRef,
  SpriteData,
  BackdropData,
  SpriteVariable,
  SensingState,
  IMLPrediction,
} from '../domain/entities';
import { IHardwareBoard } from '../domain/ports/IHardwareBoard';

// Hooks & Services
import { useStageRunner } from '../hooks/Code/useStageRunner';
import { useSpriteManager } from '../hooks/Code/useSpriteManager';
import { useHardwareManager } from '../hooks/Code/useHardwareManager';
import { useFirmware } from './FirmwareContext';
import { useUI } from './UIContext';
import { useProject } from './ProjectContext';
import { getProjectService } from '../services/code';

export interface RuntimeState {
  isRunning: boolean;
  activeRunningCount: number;
  isAnyCodeRunning: boolean;
  isUploadMode: boolean;
  uploadModeBlocks: IBlocklyWorkspaceJson | null;
  uploadCode: string;
  isBusy: boolean;
  rocketPhase: 'ready' | 'compiling' | 'flying' | 'success' | 'failure' | '';
  rocketErrorMessage: string;
  showRocket: boolean;
  isUploading: boolean;
  serialPort: ISerialPort | null;
  isSerialConnected: boolean;
  sprites: SpriteData[];
  activeSpriteId: string;
  backdropImage: string;
  activeBackdropId: string;
  backdrops: BackdropData[];
  isRecognitionWindowOpen: boolean;
  activeQuestion: string | null;
}

export interface RuntimeActions {
  start: () => void;
  stop: (clearStage?: boolean) => void;
  setForceExecution: (force: boolean) => void;
  incrementActiveCode: () => void;
  decrementActiveCode: () => void;
  setIsUploadMode: (mode: boolean) => void;
  setUploadModeBlocks: (blocks: IBlocklyWorkspaceJson | null) => void;
  setUploadCode: (code: string) => void;
  setIsBusy: (busy: boolean) => void;
  setRocketPhase: (phase: 'ready' | 'compiling' | 'flying' | 'success' | 'failure' | '') => void;
  setRocketErrorMessage: (msg: string) => void;
  setShowRocket: (show: boolean) => void;
  setIsUploading: (uploading: boolean) => void;
  connectSerial: (explicitPort?: ISerialPort) => Promise<void>;
  disconnectSerial: () => Promise<void>;
  board: IHardwareBoard;
  restoreBoard: () => Promise<void>;
  uploadSketch: () => Promise<void>;
  setActiveSpriteId: (id: string) => void;
  setSprites: (newSprites: SpriteData[]) => void;
  deleteSprite: (id: string) => void;
  selectSprite: (id: string) => void;
  updateSpriteBlocks: (id: string, blocks: IBlocklyWorkspaceJson, code: string, variables?: SpriteVariable[]) => void;
  updateSpriteInfo: (id: string, changes: Partial<SpriteData>) => void;
  addSprite: (file?: File) => void;
  getSprite: () => SpriteData;
  getSpriteById: (id: string) => SpriteData | undefined;
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
  setRotationStyle: (style: 'all around' | 'left-right' | "don't rotate", targetId?: string) => void;
  glide: (secs: number, x: number, y: number, targetId?: string) => Promise<void>;
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
  switchCostume: (costumeIdOrType: string, targetId?: string) => Promise<void>;
  setEffect: (effect: string, value: number, targetId?: string) => void;
  changeEffect: (effect: string, delta: number, targetId?: string) => void;
  clearEffects: (targetId?: string) => void;
  goToLayer: (frontBack: 'front' | 'back', targetId?: string) => void;
  goForwardLayers: (num: number, targetId?: string) => void;
  switchBackdrop: (idOrType: string) => Promise<void>;
  switchBackdropAndWait: (idOrType: string) => Promise<void>;
  broadcast: (message: string) => Promise<void>;
  broadcastAndWait: (message: string) => Promise<void>;
  createClone: (targetId: string, callerSpriteId?: string) => Promise<void>;
  deleteClone: (targetId: string) => Promise<void>;
  registerKeyListener: (key: string, callback: () => Promise<void>) => void;
  playSound: (soundName: string, targetId?: string) => Promise<void>;
  playSoundUntilDone: (soundName: string, targetId?: string) => Promise<void>;
  stopAllSounds: () => Promise<void>;
  setSoundEffect: (effect: string, value: number, targetId?: string) => void;
  changeSoundEffect: (effect: string, delta: number, targetId?: string) => void;
  clearSoundEffects: (targetId?: string) => void;
  setVolume: (volume: number, targetId?: string) => void;
  changeVolume: (delta: number, targetId?: string) => void;
  getVolume: (targetId?: string) => number;

  clearKeyListeners: () => void;
  getSensingState: () => SensingState;
  isTouching: (spriteId: string, target: string) => boolean;
  touchingColor: (hex: string, targetId?: string) => Promise<boolean>;
  colorTouchingColor: (hex1: string, hex2: string, targetId?: string) => Promise<boolean>;
  getDistanceTo: (spriteId: string, target: string) => number;
  resetTimer: () => void;
  askAndWait: (question: string, targetId?: string) => Promise<string>;
  getSpriteProperty: (target: string, property: string) => string | number;
  submitAsk: (answer: string) => void;
  addBackdrop: (file: File) => void;
  deleteBackdrop: (id: string) => void;
  selectBackdrop: (id: string) => void;
  removeCostumeFromSprite: (spriteId: string, costumeId: string) => void;
  blocklyWorkspaceRef: React.RefObject<BlocklyWorkspaceRef | null> | null;
  setBlocklyWorkspaceRef: (ref: React.RefObject<BlocklyWorkspaceRef | null>) => void;
  openMLWindow: () => void;
  closeMLWindow: () => void;
  isIdentifiedClass: (className: string) => boolean;
  getIdentifiedClass: () => string;
  getConfidence: (className: string) => number;
  updateMonitorValue: (monitorId: string, value: string | number) => void;
  setDraggable: (draggable: boolean, targetId?: string) => void;
}

export type RuntimeContextType = RuntimeState & RuntimeActions;

const RuntimeStateContext = createContext<RuntimeState | null>(null);
const RuntimeActionsContext = createContext<RuntimeActions | null>(null);

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const ui = useUI();
  const { isRecognitionWindowOpen, setIsRecognitionWindowOpen } = useProject();
  const { uploadSketch, restoreBoard } = useFirmware();

  const {
    isUploadMode,
    setIsUploadMode,
    uploadModeBlocks,
    setUploadModeBlocks,
    uploadCode,
    setUploadCode,
    rocketPhase,
    setRocketPhase,
    rocketErrorMessage,
    setRocketErrorMessage,
    showRocket,
    setShowRocket,
    isUploading,
    setIsUploading,
    isBusy,
    setIsBusy,
  } = ui;

  const spritesManager = useSpriteManager();
  const runner = useStageRunner();
  const hardware = useHardwareManager(isBusy);

  const [blocklyWorkspaceRef, setBlocklyWorkspaceRef] = useState<React.RefObject<BlocklyWorkspaceRef | null> | null>(null);
  const mlPredictionsRef = useRef<IMLPrediction[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      mlPredictionsRef.current = (e as CustomEvent).detail;
    };
    window.addEventListener('ml-predictions-update', handler);
    return () => window.removeEventListener('ml-predictions-update', handler);
  }, []);

  const currentBackdrop = useMemo(
    () => spritesManager.backdrops.find((b: BackdropData) => b.id === spritesManager.activeBackdropId) || spritesManager.backdrops[0],
    [spritesManager.backdrops, spritesManager.activeBackdropId],
  );

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

  const stateValue: RuntimeState = useMemo(
    () => ({
      isRunning: runner.isRunning,
      activeRunningCount: runner.activeRunningCount,
      isAnyCodeRunning: runner.isRunning || runner.activeRunningCount > 0,
      isUploadMode,
      uploadModeBlocks,
      uploadCode,
      isBusy,
      rocketPhase,
      rocketErrorMessage,
      showRocket,
      isUploading,
      serialPort: hardware.serialPort,
      isSerialConnected: hardware.isSerialConnected,
      sprites: spritesManager.sprites,
      activeSpriteId: spritesManager.activeSpriteId,
      backdropImage,
      activeBackdropId: spritesManager.activeBackdropId,
      backdrops: spritesManager.backdrops,
      isRecognitionWindowOpen,
      activeQuestion: runner.activeQuestion,
    }),
    [
      runner.isRunning,
      runner.activeRunningCount,
      isUploadMode,
      uploadModeBlocks,
      uploadCode,
      isBusy,
      rocketPhase,
      rocketErrorMessage,
      showRocket,
      isUploading,
      hardware.serialPort,
      hardware.isSerialConnected,
      spritesManager.sprites,
      spritesManager.activeSpriteId,
      backdropImage,
      spritesManager.activeBackdropId,
      spritesManager.backdrops,
      isRecognitionWindowOpen,
      runner.activeQuestion,
    ],
  );

  const actionsValue: RuntimeActions = useMemo(
    () => ({
      start: runner.start,
      stop: runner.stop,
      setForceExecution: runner.setForceExecution,
      incrementActiveCode: runner.incrementActiveCode,
      decrementActiveCode: runner.decrementActiveCode,
      setIsUploadMode,
      setUploadModeBlocks,
      setUploadCode,
      setIsBusy,
      setRocketPhase,
      setRocketErrorMessage,
      setShowRocket,
      setIsUploading,
      connectSerial: hardware.connectSerial,
      disconnectSerial: hardware.disconnectSerial,
      board: hardware.board,
      restoreBoard,
      uploadSketch,
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
      setRotationStyle: runner.setRotationStyle,
      glide: runner.glide,
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
      setEffect: runner.setEffect,
      changeEffect: runner.changeEffect,
      clearEffects: runner.clearEffects,
      goToLayer: runner.goToLayer,
      goForwardLayers: runner.goForwardLayers,
      switchBackdrop: runner.switchBackdrop,
      switchBackdropAndWait: runner.switchBackdropAndWait,
      broadcast: runner.broadcast,
      broadcastAndWait: runner.broadcastAndWait,
      createClone: runner.createClone,
      deleteClone: runner.deleteClone,
      registerKeyListener: runner.registerKeyListener,
      playSound: runner.playSound,
      playSoundUntilDone: runner.playSoundUntilDone,
      stopAllSounds: runner.stopAllSounds,
      setSoundEffect: runner.setSoundEffect,
      changeSoundEffect: runner.changeSoundEffect,
      clearSoundEffects: runner.clearSoundEffects,
      setVolume: runner.setVolume,
      changeVolume: runner.changeVolume,
      getVolume: runner.getVolume,

      clearKeyListeners: runner.clearKeyListeners,
      getSensingState: runner.getSensingState,
      isTouching: runner.isTouching,
      touchingColor: runner.touchingColor,
      colorTouchingColor: runner.colorTouchingColor,
      getDistanceTo: runner.getDistanceTo,
      resetTimer: runner.resetTimer,
      askAndWait: runner.askAndWait,
      getSpriteProperty: runner.getSpriteProperty,
      submitAsk: runner.submitAsk,
      addBackdrop: spritesManager.addBackdrop,
      deleteBackdrop: spritesManager.deleteBackdrop,
      selectBackdrop: spritesManager.selectBackdrop,
      addCostumeToSprite: (sId: string, f: File) => getProjectService().addCostumeToSprite(sId, f),
      removeCostumeFromSprite: (sId: string, cId: string) => getProjectService().removeCostumeFromSprite(sId, cId),
      blocklyWorkspaceRef,
      setBlocklyWorkspaceRef,
      openMLWindow: () => setIsRecognitionWindowOpen(true),
      closeMLWindow: () => setIsRecognitionWindowOpen(false),
      isIdentifiedClass: (className: string) => {
        const preds = mlPredictionsRef.current;
        const pred = preds?.find((p: IMLPrediction) => p.label === className);
        return pred ? pred.value >= 80 : false;
      },
      getIdentifiedClass: () => {
        const preds = mlPredictionsRef.current;
        if (!preds || preds.length === 0) return '';
        return preds.reduce((prev: IMLPrediction, current: IMLPrediction) => (prev.value > current.value ? prev : current)).label;
      },
      getConfidence: (className: string) => {
        const preds = mlPredictionsRef.current;
        return preds?.find((p: IMLPrediction) => p.label === className)?.value || 0;
      },
      updateMonitorValue: runner.updateMonitorValue,
      setDraggable: runner.setDraggable,
    }),
    [
      setIsUploadMode,
      setUploadModeBlocks,
      setUploadCode,
      setIsBusy,
      setRocketPhase,
      setRocketErrorMessage,
      setShowRocket,
      setIsUploading,
      hardware,
      restoreBoard,
      uploadSketch,
      spritesManager,
      runner,
      blocklyWorkspaceRef,
      setIsRecognitionWindowOpen,
      getSprite,
      getSpriteById,
    ],
  );

  return (
    <RuntimeActionsContext.Provider value={actionsValue}>
      <RuntimeStateContext.Provider value={stateValue}>{children}</RuntimeStateContext.Provider>
    </RuntimeActionsContext.Provider>
  );
}

export function useRuntime(): RuntimeContextType {
  const state = useContext(RuntimeStateContext);
  const actions = useContext(RuntimeActionsContext);
  if (!state || !actions) throw new Error('useRuntime must be used within a RuntimeProvider');
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

export const useStage = useRuntime;
export const useExecutionRunner = useRuntime;

// Type Aliases for migration
export type StageContextType = RuntimeContextType;
export type ExecutionRunnerContextType = RuntimeContextType;
