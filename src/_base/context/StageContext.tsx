/**
 * StageContext - O coordenador central de execução e sincronismo visual.
 *
 * Responsabilidade: Orquestrar a execução do código (JS no Palco ou C++ na Placa),
 * o sincronismo dos atores e a interface de upload de firmware. Atua como o
 * ponto de integração final entre Runners, Gerenciamento de Sprites e Hardware.
 *
 * Operações Principais:
 * - start/stop: Controle da VM de execução para simulação visual.
 * - uploadSketch/restoreBoard: Gestão do fluxo completo de gravação no componente físico.
 * - Ações atômicas (move, say, turn): Mapeamento de blocos para comportamento real.
 *
 * Interações: Consolida lógica de hooks avançados como `useStageRunner`,
 * `useSpriteManager` e `useHardwareManager`.
 */
'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useMemo, useCallback } from 'react';

// Adaptadores e Portas
import { IHardwareBoard } from '../domain/ports/IHardwareBoard';
import { useProject } from '../context/ProjectContext';
import { useUI } from '../context/UIContext';

import { ISerialPort, IBlocklyWorkspaceJson, BlocklyWorkspaceRef } from '../domain/entities';
import { SpriteData, BackdropData, SpriteVariable, IMLPrediction } from '../domain/entities';

// Hooks de Lógica Específica
import { useStageRunner } from '../hooks/Code/useStageRunner';
import { useSpriteManager } from '../hooks/Code/useSpriteManager';
import { useHardwareManager } from '../hooks/Code/useHardwareManager';
import { useFirmware } from './FirmwareContext';
import { getProjectService } from '../services/code';
import StageBoard from '../services/code/StageBoard';

export interface StageContextType {
  isRunning: boolean; // Indica se a simulação no palco está ativa
  isUploadMode: boolean; // Se o editor está no modo de programação da placa
  setIsUploadMode: (mode: boolean) => void;
  uploadModeBlocks: IBlocklyWorkspaceJson | null; // Armazena o JSON dos blocos do modo Upload
  setUploadModeBlocks: (blocks: IBlocklyWorkspaceJson | null) => void;
  uploadCode: string; // Código C++ gerado pronto para compilação
  setUploadCode: (code: string) => void;

  // Estado da UI de Upload
  rocketPhase: 'ready' | 'compiling' | 'flying' | 'success' | 'failure' | '';
  setRocketPhase: (phase: 'ready' | 'compiling' | 'flying' | 'success' | 'failure' | '') => void;
  rocketErrorMessage: string;
  setRocketErrorMessage: (msg: string) => void;

  showRocket: boolean;
  setShowRocket: (show: boolean) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  isBusy: boolean;
  setIsBusy: (busy: boolean) => void;

  // Ações
  restoreBoard: () => Promise<void>;
  uploadSketch: () => Promise<void>;

  // Serial
  serialPort: ISerialPort | null;
  isSerialConnected: boolean;
  connectSerial: (explicitPort?: ISerialPort) => Promise<void>;
  disconnectSerial: () => Promise<void>;
  board: IHardwareBoard;

  // Atores (Sprites)
  sprites: SpriteData[];
  activeSpriteId: string;

  start: () => void;
  stop: () => void;

  deleteSprite: (id: string) => void;
  selectSprite: (id: string) => void;
  updateSpriteBlocks: (id: string, blocks: IBlocklyWorkspaceJson, code: string, variables?: SpriteVariable[]) => void;
  updateSpriteInfo: (id: string, changes: Partial<SpriteData>) => void; // Assinatura mantida

  // Ações principais expostas para Geradores
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

  // Aparência
  setSize: (size: number, targetId?: string) => Promise<void>;
  changeSize: (delta: number, targetId?: string) => Promise<void>;
  show: (targetId?: string) => Promise<void>;
  hide: (targetId?: string) => Promise<void>;

  registerKeyListener: (key: string, callback: () => Promise<void>) => void;
  clearKeyListeners: () => void;

  // Ações de Fantasia
  switchCostume: (costumeIdOrType: string, targetId?: string) => Promise<void>;
  addCostumeToSprite: (spriteId: string, file: File) => void;
  removeCostumeFromSprite: (spriteId: string, costumeId: string) => void;

  // Getters de Estado
  getSprite: () => SpriteData;
  getSpriteById: (id: string) => SpriteData | undefined;

  // Cenários (Backdrops)
  backdropImage: string;
  activeBackdropId: string;
  backdrops: BackdropData[];
  addBackdrop: (file: File) => void;
  deleteBackdrop: (id: string) => void;
  selectBackdrop: (id: string) => void;
  switchBackdrop: (idOrType: string) => Promise<void>;

  // Gestão de Atores
  addSprite: (file?: File) => void;

  // Controle de Execução ao Vivo
  setForceExecution: (force: boolean) => void;

  // Manutenção / Carga
  setSprites: (newSprites: SpriteData[]) => void;
  setActiveSpriteId: (id: string) => void;

  // Manutenção de Cenários
  setBackdrops: (newBackdrops: BackdropData[]) => void;
  setActiveBackdropId: (id: string) => void;

  // Workspace Blockly
  blocklyWorkspaceRef: React.RefObject<BlocklyWorkspaceRef | null> | null;
  setBlocklyWorkspaceRef: (ref: React.RefObject<BlocklyWorkspaceRef | null>) => void;

  // ML Actions
  openMLWindow: () => void;
  closeMLWindow: () => void;
  // ML Getters
  isIdentifiedClass: (className: string) => boolean;
  getIdentifiedClass: () => string;
  getConfidence: (className: string) => number;
}

const StageContext = createContext<StageContextType | null>(null);

export function StageProvider({ children }: { children: ReactNode }) {
  // --- UI STATE ---
  const [blocklyWorkspaceRef, setBlocklyWorkspaceRef] = useState<React.RefObject<BlocklyWorkspaceRef | null> | null>(null);
  const ui = useUI();

  // Sincroniza estados com UIContext para evitar duplicidade de estado
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

  // --- HOOKS ---
  const hardware = useHardwareManager(isBusy);
  const spritesManager = useSpriteManager();
  const runner = useStageRunner();
  const { setIsRecognitionWindowOpen } = useProject();
  const { uploadSketch, restoreBoard } = useFirmware();

  // Ref para predições ML (NÃO state, para evitar re-renders em cascata)
  const mlPredictionsRef = useRef<IMLPrediction[]>([]);
  useEffect(() => {
    const handler = (e: Event) => {
      mlPredictionsRef.current = (e as CustomEvent).detail;
    };
    window.addEventListener('ml-predictions-update', handler);
    return () => window.removeEventListener('ml-predictions-update', handler);
  }, []);

  // --- COMPLEX ACTIONS (Upload/Restore) ---

  // Helpers expostos por conveniência
  const currentBackdrop = spritesManager.backdrops.find((b) => b.id === spritesManager.activeBackdropId) || spritesManager.backdrops[0];
  const backdropImage = currentBackdrop?.url || '';

  const getSprite = useCallback(() => {
    return spritesManager.sprites.find((s) => s.id === spritesManager.activeSpriteId) || spritesManager.sprites[0];
  }, [spritesManager.sprites, spritesManager.activeSpriteId]);

  const getSpriteById = useCallback(
    (id: string) => {
      return spritesManager.sprites.find((s) => s.id === id);
    },
    [spritesManager.sprites],
  );

  const value = useMemo<StageContextType>(
    () => ({
      isRunning: runner.isRunning,
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

      restoreBoard,
      uploadSketch,

      serialPort: hardware.serialPort,
      isSerialConnected: hardware.isSerialConnected,
      connectSerial: hardware.connectSerial,
      disconnectSerial: hardware.disconnectSerial,
      board: hardware.board,

      sprites: spritesManager.sprites,
      activeSpriteId: spritesManager.activeSpriteId,

      start: runner.start,
      stop: runner.stop,

      deleteSprite: spritesManager.deleteSprite,
      selectSprite: spritesManager.selectSprite,
      updateSpriteBlocks: spritesManager.updateSpriteBlocks,
      updateSpriteInfo: spritesManager.updateSpriteInfo,

      // Ações
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

      // Fantasia
      addCostumeToSprite: (spriteId: string, file: File) => {
        getProjectService().addCostumeToSprite(spriteId, file);
      },
      removeCostumeFromSprite: (spriteId: string, costumeId: string) => {
        getProjectService().removeCostumeFromSprite(spriteId, costumeId);
      },

      getSprite,
      getSpriteById,

      backdropImage,
      activeBackdropId: spritesManager.activeBackdropId,
      backdrops: spritesManager.backdrops,
      addBackdrop: spritesManager.addBackdrop,
      deleteBackdrop: spritesManager.deleteBackdrop,
      selectBackdrop: spritesManager.selectBackdrop,

      switchBackdrop: async (idOrType: string) => {
        const service = getProjectService();
        const all = service.getBackdrops();
        const activeId = service.getActiveBackdropId();
        let targetId = activeId;
        const idx = all.findIndex((b) => b.id === activeId);

        if (idOrType === 'NEXT') {
          targetId = all[(idx + 1) % all.length].id;
        } else if (idOrType === 'PREVIOUS') {
          targetId = all[(idx - 1 + all.length) % all.length].id;
        } else if (idOrType === 'RANDOM') {
          targetId = all[Math.floor(Math.random() * all.length)].id;
        } else {
          if (all.some((b) => b.id === idOrType)) targetId = idOrType;
        }
        service.setActiveBackdropId(targetId);
        if (runner.isRunning) await runner.wait(0.05);
      },

      addSprite: spritesManager.addSprite,
      setForceExecution: runner.setForceExecution,
      setSprites: spritesManager.setSpritesExternal,
      setActiveSpriteId: spritesManager.setActiveSpriteIdExternal,
      setBackdrops: spritesManager.setBackdropsExternal,
      setActiveBackdropId: spritesManager.setActiveBackdropIdExternal,

      blocklyWorkspaceRef,
      setBlocklyWorkspaceRef,

      // ML Actions & Getters
      openMLWindow: () => setIsRecognitionWindowOpen(true),
      closeMLWindow: () => setIsRecognitionWindowOpen(false),
      isIdentifiedClass: (className: string) => {
        const preds = mlPredictionsRef.current;
        if (!preds || preds.length === 0) return false;
        const target = preds.find((p: IMLPrediction) => p.label === className);
        return target ? target.value >= 80 : false;
      },
      getIdentifiedClass: () => {
        const preds = mlPredictionsRef.current;
        if (!preds || preds.length === 0) return '';
        const best = preds.reduce((prev: IMLPrediction, current: IMLPrediction) => (prev.value > current.value ? prev : current));
        return best.value >= 0 ? best.label : '';
      },
      getConfidence: (className: string) => {
        const preds = mlPredictionsRef.current;
        if (!preds || preds.length === 0) return 0;
        const target = preds.find((p: IMLPrediction) => p.label === className);
        return target ? target.value : 0;
      },
    }),
    [
      runner,
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
      hardware,
      spritesManager,
      backdropImage,
      blocklyWorkspaceRef,
      setIsRecognitionWindowOpen,
      getSprite,
      getSpriteById,
      restoreBoard,
      uploadSketch,
    ],
  );

  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export const useStage = () => {
  const context = useContext(StageContext);
  if (!context) {
    throw new Error('useStage must be used within a StageProvider');
  }
  return context;
};
