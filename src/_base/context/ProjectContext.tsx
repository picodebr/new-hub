/**
 * ProjectContext - Provedor de estado global do projeto (Atores, Cenários e Variáveis).
 *
 * Responsabilidade: Atuar como a ponte principal entre o `ProjectService` (lógica de negócio)
 * e a interface React. Gerencia a sincronização de dados entre a camada de serviço
 * e a renderização, garantindo que mudanças no Singleton sejam refletidas na UI via
 * sistema de eventos e hooks reativos.
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { SpriteData, CostumeData, BackdropData, IBlocklyWorkspaceJson, SpriteVariable, SpriteList, IMLModel, MonitorData } from '../domain/entities';
import { getProjectService, ProjectService } from '../services/code';

interface ProjectContextType {
  // Sprites
  sprites: SpriteData[];
  activeSpriteId: string;
  activeSprite: SpriteData;
  addSprite: (file?: File) => Promise<void>;
  addSpriteFromLibrary: (
    name: string,
    url: string,
    costumes?: { name: string; url: string }[],
    sounds?: { name: string; url: string; format: 'wav' | 'mp3' }[],
  ) => Promise<void>;
  addSurpriseSprite: () => Promise<void>;
  deleteSprite: (id: string) => void;
  updateSprite: (id: string, changes: Partial<SpriteData>, silent?: boolean) => void;
  updateSpriteBlocks: (id: string, blocks: IBlocklyWorkspaceJson, code: string, variables?: SpriteVariable[]) => void;
  selectSprite: (id: string) => void;
  setSprites: (sprites: SpriteData[]) => void;
  setActiveSpriteId: (id: string) => void;
  getSpriteById: (id: string) => SpriteData | undefined;
  duplicateSprite: (id: string) => void;
  lastRealSpriteId: string;

  // Costumes
  addCostumeToSprite: (spriteId: string, file?: File) => Promise<void>;
  updateCostume: (spriteId: string, costumeId: string, thumbnailUrl: string, stageUrl?: string) => void;
  updateCostumeThumbnail: (spriteId: string, costumeId: string, thumbnailUrl: string, stageUrl?: string) => void;
  switchCostume: (spriteId: string, costumeId: string) => void;
  renameCostume: (spriteId: string, costumeId: string, newName: string) => void;
  removeCostumeFromSprite: (spriteId: string, costumeId: string) => void;
  duplicateCostume: (spriteId: string, costumeId: string) => void;

  // Sounds
  addSoundToSprite: (spriteId: string, file?: File) => Promise<void>;
  switchSound: (spriteId: string, soundId: string) => void;
  renameSound: (spriteId: string, soundId: string, newName: string) => void;
  removeSoundFromSprite: (spriteId: string, soundId: string) => void;
  updateSoundData: (spriteId: string, soundId: string, blob: Blob) => Promise<void>;
  playSound: (url: string) => Promise<void>;

  // Backdrops
  backdrops: BackdropData[];
  activeBackdropId: string;
  activeBackdrop: BackdropData;
  addBackdrop: (file?: File) => Promise<void>;
  addBackdropFromLibrary: (name: string, url: string) => Promise<void>;
  addSurpriseBackdrop: () => Promise<void>;
  deleteBackdrop: (id: string) => void;
  selectBackdrop: (id: string) => void;
  setBackdrops: (backdrops: BackdropData[]) => void;
  setActiveBackdropId: (id: string) => void;
  renameBackdrop: (backdropId: string, newName: string) => void;

  // Global Variables (Separated by Mode)
  stageVariables: SpriteVariable[];
  uploadVariables: SpriteVariable[];

  // Mode-aware variable methods
  getUserVariables: (mode: 'stage' | 'upload') => SpriteVariable[];
  addVariable: (mode: 'stage' | 'upload', name: string, type: string, scope?: 'global' | 'local') => void;
  renameVariable: (mode: 'stage' | 'upload', oldName: string, newName: string) => void;
  deleteVariable: (mode: 'stage' | 'upload', name: string) => void;
  forceSyncVariables: () => void;

  // Lists (Separated by Mode)
  stageLists: SpriteList[];
  uploadLists: SpriteList[];

  // Mode-aware list methods
  getUserLists: (mode: 'stage' | 'upload') => SpriteList[];
  addList: (mode: 'stage' | 'upload', name: string, scope?: 'global' | 'local') => SpriteList | null;
  renameList: (mode: 'stage' | 'upload', oldName: string, newName: string) => void;
  deleteList: (mode: 'stage' | 'upload', name: string) => void;
  forceSyncLists: () => void;

  // ML Integration
  activeStageMLModel: IMLModel | null;
  setActiveStageMLModel: (model: IMLModel | null) => void;
  activeUploadMLModel: IMLModel | null;
  setActiveUploadMLModel: (model: IMLModel | null) => void;
  isRecognitionWindowOpen: boolean;
  setIsRecognitionWindowOpen: (isOpen: boolean) => void;
  currentMLPredictions: { label: string; value: number }[];
  setCurrentMLPredictions: (preds: { label: string; value: number }[]) => void;

  // Monitors (Scratch-like)
  monitors: MonitorData[];
  setMonitorVisibility: (monitorId: string, visible: boolean, data?: Partial<MonitorData>) => void;
  updateMonitorValue: (monitorId: string, value: string | number) => void;
  updateMonitorItems: (monitorId: string, items: (string | number)[]) => void;
  updateMonitorPosition: (monitorId: string, x: number, y: number) => void;
  // Broadcast Messages
  getBroadcastMessages: () => string[];
  addBroadcastMessage: (name: string) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectService] = useState<ProjectService>(() => getProjectService());
  const [sprites, setSpritesState] = useState<SpriteData[]>(() => projectService.getSprites());
  const lastRevisionRef = useRef<number>(-1);
  const [activeSpriteId, setActiveSpriteIdState] = useState<string>(() => projectService.getActiveSpriteId());
  const [backdrops, setBackdropsState] = useState<BackdropData[]>(() => projectService.getBackdrops());
  const [activeBackdropId, setActiveBackdropIdState] = useState<string>(() => projectService.getActiveBackdropId());
  const [lastRealSpriteId, setLastRealSpriteId] = useState<string>(() => {
    const currentActive = projectService.getActiveSpriteId();
    if (currentActive && currentActive !== 'stage') return currentActive;
    const allSprites = projectService.getSprites();
    return allSprites[0]?.id || '';
  });

  const [activeStageMLModel, setActiveStageMLModel] = useState<IMLModel | null>(null);
  const [activeUploadMLModel, setActiveUploadMLModel] = useState<IMLModel | null>(null);
  const [isRecognitionWindowOpen, setIsRecognitionWindowOpen] = useState(false);
  const [currentMLPredictions, setCurrentMLPredictions] = useState<{ label: string; value: number }[]>([]);

  const [stageVariables, setStageVariablesState] = useState<SpriteVariable[]>(() => projectService.getVariables('stage'));
  const [uploadVariables, setUploadVariablesState] = useState<SpriteVariable[]>(() => projectService.getVariables('upload'));
  const [stageLists, setStageListsState] = useState<SpriteList[]>(() => projectService.getLists('stage'));
  const [uploadLists, setUploadListsState] = useState<SpriteList[]>(() => projectService.getLists('upload'));
  const [monitors, setMonitors] = useState<MonitorData[]>([]);

  // --- MONITOR METHODS ---
  const setMonitorVisibility = useCallback((monitorId: string, visible: boolean, data?: Partial<MonitorData>) => {
    setMonitors((prev) => {
      const exists = prev.find((m) => m.id === monitorId);
      if (exists) return prev.map((m) => (m.id === monitorId ? { ...m, visible } : m));
      if (!visible || !data) return prev;

      const isListType = data.type === 'list';
      const newMonitor: MonitorData = {
        id: monitorId,
        spriteId: data.spriteId || 'stage',
        type: data.type || 'sensing',
        label: data.label || monitorId,
        value: 0,
        items: isListType ? [] : undefined,
        visible: true,
        x: 10,
        y: prev.length * 35 + 10,
        width: isListType ? 120 : undefined,
        height: isListType ? 200 : undefined,
        color: data.color,
      };
      return [...prev, newMonitor];
    });
  }, []);

  const updateMonitorValue = useCallback((monitorId: string, value: string | number) => {
    setMonitors((prev) => {
      const monitor = prev.find((m) => m.id === monitorId);
      if (monitor?.value === value) return prev; // Phase 5.3: Skip update if value is identical
      return prev.map((m) => (m.id === monitorId ? { ...m, value } : m));
    });
  }, []);

  const updateMonitorItems = useCallback((monitorId: string, items: (string | number)[]) => {
    setMonitors((prev) => {
      const monitor = prev.find((m) => m.id === monitorId);
      if (!monitor) return prev;
      // Shallow comparison: skip update when length and content are identical
      const current = monitor.items;
      if (current && current.length === items.length && current.every((v, i) => v === items[i])) return prev;
      return prev.map((m) => (m.id === monitorId ? { ...m, items: [...items] } : m));
    });
  }, []);

  const updateMonitorPosition = useCallback((monitorId: string, x: number, y: number) => {
    setMonitors((prev) => prev.map((m) => (m.id === monitorId ? { ...m, x, y } : m)));
  }, []);

  // --- HYBRID SYNC SYSTEM (Restoring Smooth Movement) ---
  //
  // ARQUITETURA PUSH/PULL:
  // - Meta-eventos (seleção de ator/cenário): PUSH imediato via event listeners.
  //   São de baixa frequência e devem atualizar React state instantaneamente para que
  //   o Blockly e os painéis de propriedade reflitam a seleção correta.
  //
  // - Dados de alta frequência (sprites, backdrops, variáveis, listas): PULL via RAF
  //   throttled a 30fps. O WebGL já roda a 60fps de forma independente do React,
  //   então 30fps é suficiente para atualizar a SpriteGrid e os formulários de UI.
  //
  // BATCHING: Todos os seis setState dentro do syncLoop são executados de forma síncrona
  // dentro de um único callback requestAnimationFrame. O React 18 automatic batching
  // garante que eles sejam processados em UM ÚNICO re-render, não seis.
  useEffect(() => {
    // 1. Meta-eventos (mudanças estruturais de baixa frequência)
    const handleActiveSpriteChange = (newId: string) => {
      setActiveSpriteIdState(newId);
      if (newId !== 'stage') {
        setLastRealSpriteId(newId);
      }
    };
    // backdrops é atualizado junto com activeBackdropId no mesmo batch React para evitar
    // a janela onde activeBackdropId aponta para um ID ainda não presente em backdrops,
    // causando fallback para backdrops[0] (cenário padrão) antes do RAF sync chegar.
    const handleActiveBackdropChange = (newId: string) => {
      setActiveBackdropIdState(newId);
      setBackdropsState([...projectService.getBackdrops()]);
    };

    projectService.on('activeSpriteChange', handleActiveSpriteChange);
    projectService.on('activeBackdropChange', handleActiveBackdropChange);

    // 2. Heartbeat de alta frequência (dados visuais)
    // Throttled a 30fps — O WebGL já tem seu próprio loop de 60fps independente.
    let frameId: number;
    let lastSyncTime = performance.now();
    const SYNC_INTERVAL_MS = 1000 / 30; // 30 FPS para a UI de sprites/variáveis

    const syncLoop = (time: number) => {
      if (time - lastSyncTime >= SYNC_INTERVAL_MS) {
        const currentRev = projectService.getStateRevision();
        if (currentRev !== lastRevisionRef.current) {
          // Todos os setState abaixo são agrupados pelo React 18 automatic batching
          // em um único re-render, pois executam de forma síncrona no mesmo callback.
          setSpritesState([...projectService.getSprites()]);
          setBackdropsState([...projectService.getBackdrops()]);
          setStageVariablesState([...projectService.getVariables('stage')]);
          setUploadVariablesState([...projectService.getVariables('upload')]);
          setStageListsState([...projectService.getLists('stage')]);
          setUploadListsState([...projectService.getLists('upload')]);
          lastRevisionRef.current = currentRev;
        }
        lastSyncTime = time;
      }
      frameId = requestAnimationFrame(syncLoop);
    };
    frameId = requestAnimationFrame(syncLoop);

    return () => {
      cancelAnimationFrame(frameId);
      projectService.off('activeSpriteChange', handleActiveSpriteChange);
      projectService.off('activeBackdropChange', handleActiveBackdropChange);
    };
  }, [projectService]);

  // Computed values
  const activeBackdrop = useMemo(() => backdrops.find((b) => b.id === activeBackdropId) || backdrops[0], [backdrops, activeBackdropId]);

  const activeSprite = useMemo(() => {
    if (activeSpriteId === 'stage') {
      const stageBlocks = projectService.getStageBlocks();
      return {
        id: 'stage',
        name: 'Palco',
        costumes: backdrops as CostumeData[],
        currentCostumeId: activeBackdropId,
        sounds: activeBackdrop?.sounds ?? [],
        currentSoundId: activeBackdrop?.currentSoundId ?? null,
        x: 0,
        y: 0,
        angle: 0,
        size: 100,
        visible: true,
        costume: activeBackdrop?.stageUrl || activeBackdrop?.url || '',
        blocks: stageBlocks?.blocks,
        code: stageBlocks?.code || '',
        isStage: true,
        rotationStyle: 'all around',
        volume: 100,
        bubbleText: '',
        bubbleType: null,
        draggable: false,
      } as SpriteData;
    }
    return sprites.find((s) => s.id === activeSpriteId) || sprites[0];
  }, [activeSpriteId, sprites, backdrops, activeBackdropId, activeBackdrop, projectService]);

  // Sprite methods
  const addSprite = useCallback(async (file?: File) => await projectService.addSprite(file), [projectService]);
  const addSpriteFromLibrary = useCallback(
    async (n: string, u: string, c?: { name: string; url: string }[], s?: { name: string; url: string; format: 'wav' | 'mp3' }[]) =>
      await projectService.addSpriteFromLibrary(n, u, c, s),
    [projectService],
  );
  const addSurpriseSprite = useCallback(async () => await projectService.addSurpriseSprite(), [projectService]);
  const deleteSprite = useCallback((id: string) => projectService.deleteSprite(id), [projectService]);
  const updateSprite = useCallback(
    (id: string, ch: Partial<SpriteData>, s: boolean = false) => projectService.updateSprite(id, ch, s),
    [projectService],
  );
  const updateSpriteBlocks = useCallback(
    (id: string, b: IBlocklyWorkspaceJson, c: string, v?: SpriteVariable[]) => projectService.updateSpriteBlocks(id, b, c, v),
    [projectService],
  );
  const selectSprite = useCallback((id: string) => projectService.selectSprite(id), [projectService]);
  const setSprites = useCallback((ns: SpriteData[]) => projectService.setSprites(ns), [projectService]);
  const setActiveSpriteId = useCallback((id: string) => projectService.setActiveSpriteId(id), [projectService]);
  const getSpriteById = useCallback((id: string) => projectService.getSpriteById(id), [projectService]);
  const duplicateSprite = useCallback((id: string) => projectService.duplicateSprite(id), [projectService]);

  // Costume methods
  const addCostumeToSprite = useCallback(async (sid: string, f?: File) => await projectService.addCostumeToSprite(sid, f), [projectService]);
  const updateCostume = useCallback(
    (sid: string, cid: string, t: string, st?: string) => projectService.updateCostume(sid, cid, t, st),
    [projectService],
  );
  const updateCostumeThumbnail = useCallback(
    (sid: string, cid: string, t: string, st?: string) => projectService.updateCostumeThumbnail(sid, cid, t, st),
    [projectService],
  );
  const switchCostume = useCallback((sid: string, cid: string) => projectService.switchCostume(sid, cid), [projectService]);
  const renameCostume = useCallback((sid: string, cid: string, n: string) => projectService.renameCostume(sid, cid, n), [projectService]);
  const removeCostumeFromSprite = useCallback((sid: string, cid: string) => projectService.removeCostumeFromSprite(sid, cid), [projectService]);
  const duplicateCostume = useCallback((sid: string, cid: string) => projectService.duplicateCostume(sid, cid), [projectService]);

  // Sound methods — roteados para cenário quando sid === 'stage'
  const addSoundToSprite = useCallback(
    async (sid: string, f?: File) => {
      if (sid === 'stage') {
        await projectService.addSoundToBackdrop(projectService.getActiveBackdropId(), f);
      } else {
        await projectService.addSoundToSprite(sid, f);
      }
    },
    [projectService],
  );

  const switchSound = useCallback(
    (sid: string, soundId: string) => {
      if (sid === 'stage') {
        projectService.switchSoundOnBackdrop(projectService.getActiveBackdropId(), soundId);
      } else {
        projectService.switchSound(sid, soundId);
      }
    },
    [projectService],
  );

  const renameSound = useCallback(
    (sid: string, soundId: string, newName: string) => {
      if (sid === 'stage') {
        projectService.renameSoundOnBackdrop(projectService.getActiveBackdropId(), soundId, newName);
      } else {
        projectService.renameSound(sid, soundId, newName);
      }
    },
    [projectService],
  );

  const removeSoundFromSprite = useCallback(
    (sid: string, soundId: string) => {
      if (sid === 'stage') {
        projectService.removeSoundFromBackdrop(projectService.getActiveBackdropId(), soundId);
      } else {
        projectService.removeSoundFromSprite(sid, soundId);
      }
    },
    [projectService],
  );

  const playSound = useCallback(async (url: string) => await projectService.playSound(url), [projectService]);
  const updateSoundData = useCallback(
    async (sid: string, soundId: string, blob: Blob) => await projectService.updateSoundData(sid, soundId, blob),
    [projectService],
  );

  // Backdrop methods
  const addBackdrop = useCallback(async (f?: File) => await projectService.addBackdrop(f), [projectService]);
  const addBackdropFromLibrary = useCallback(async (n: string, u: string) => await projectService.addBackdropFromLibrary(n, u), [projectService]);
  const addSurpriseBackdrop = useCallback(async () => await projectService.addSurpriseBackdrop(), [projectService]);
  const deleteBackdrop = useCallback((id: string) => projectService.deleteBackdrop(id), [projectService]);
  const selectBackdrop = useCallback((id: string) => projectService.selectBackdrop(id), [projectService]);
  const setBackdrops = useCallback((nb: BackdropData[]) => projectService.setBackdrops(nb), [projectService]);
  const setActiveBackdropId = useCallback((id: string) => projectService.setActiveBackdropId(id), [projectService]);
  const renameBackdrop = useCallback((id: string, n: string) => projectService.renameBackdrop(id, n), [projectService]);

  // Variable methods
  const getUserVariables = useCallback(
    (mode: 'stage' | 'upload') => projectService.getUserVariables(mode, activeSpriteId),
    [projectService, activeSpriteId],
  );

  const addVariable = useCallback(
    (mode: 'stage' | 'upload', n: string, t: string, s?: 'global' | 'local') => projectService.addVariable(mode, n, t, s, activeSpriteId),
    [projectService, activeSpriteId],
  );

  const renameVariable = useCallback(
    (mode: 'stage' | 'upload', oldN: string, newN: string) => projectService.renameVariable(mode, oldN, newN),
    [projectService],
  );
  const deleteVariable = useCallback((mode: 'stage' | 'upload', n: string) => projectService.deleteVariable(mode, n), [projectService]);
  const forceSyncVariables = useCallback(() => projectService.forceSyncVariables(), [projectService]);

  // List methods
  const getUserLists = useCallback((mode: 'stage' | 'upload') => projectService.getUserLists(mode, activeSpriteId), [projectService, activeSpriteId]);

  const addList = useCallback(
    (mode: 'stage' | 'upload', name: string, scope?: 'global' | 'local') => {
      const list = projectService.addList(mode, name, scope, activeSpriteId);
      // Auto-exibe o monitor da lista ao criá-la no modo Stage (comportamento Scratch)
      if (list && mode === 'stage') {
        setMonitorVisibility(`list_${list.id}`, true, {
          label: list.name,
          type: 'list',
          color: '#FF8C1A',
          spriteId: 'stage',
        });
      }
      return list;
    },
    [projectService, activeSpriteId, setMonitorVisibility],
  );

  const renameList = useCallback(
    (mode: 'stage' | 'upload', oldN: string, newN: string) => projectService.renameList(mode, oldN, newN),
    [projectService],
  );
  const deleteList = useCallback(
    (mode: 'stage' | 'upload', n: string) => {
      // Remove o monitor antes de deletar a lista
      if (mode === 'stage') {
        const lists = projectService.getUserLists(mode, activeSpriteId);
        const list = lists.find((l) => l.name === n);
        if (list) {
          setMonitors((prev) => prev.filter((m) => m.id !== `list_${list.id}`));
        }
      }
      projectService.deleteList(mode, n);
    },
    [projectService, activeSpriteId],
  );
  const forceSyncLists = useCallback(() => projectService.forceSyncLists(), [projectService]);

  const getBroadcastMessages = useCallback(() => projectService.getBroadcastMessages(), [projectService]);
  const addBroadcastMessage = useCallback((name: string) => projectService.addBroadcastMessage(name), [projectService]);

  const value: ProjectContextType = useMemo(
    () => ({
      sprites,
      activeSpriteId,
      activeSprite,
      lastRealSpriteId,
      addSprite,
      addSpriteFromLibrary,
      addSurpriseSprite,
      deleteSprite,
      updateSprite,
      updateSpriteBlocks,
      selectSprite,
      setSprites,
      setActiveSpriteId,
      getSpriteById,
      duplicateSprite,
      addCostumeToSprite,
      updateCostume,
      updateCostumeThumbnail,
      switchCostume,
      renameCostume,
      removeCostumeFromSprite,
      duplicateCostume,
      addSoundToSprite,
      switchSound,
      renameSound,
      removeSoundFromSprite,
      updateSoundData,
      playSound,
      backdrops,
      activeBackdropId,
      activeBackdrop,
      addBackdrop,
      addBackdropFromLibrary,
      addSurpriseBackdrop,
      deleteBackdrop,
      selectBackdrop,
      setBackdrops,
      setActiveBackdropId,
      renameBackdrop,
      stageVariables,
      uploadVariables,
      getUserVariables,
      addVariable,
      renameVariable,
      deleteVariable,
      forceSyncVariables,
      stageLists,
      uploadLists,
      getUserLists,
      addList,
      renameList,
      deleteList,
      forceSyncLists,
      activeStageMLModel,
      setActiveStageMLModel,
      activeUploadMLModel,
      setActiveUploadMLModel,
      isRecognitionWindowOpen,
      setIsRecognitionWindowOpen,
      currentMLPredictions,
      setCurrentMLPredictions,
      monitors,
      setMonitorVisibility,
      updateMonitorValue,
      updateMonitorItems,
      updateMonitorPosition,
      getBroadcastMessages,
      addBroadcastMessage,
    }),
    [
      sprites,
      activeSpriteId,
      activeSprite,
      backdrops,
      activeBackdropId,
      activeBackdrop,
      stageVariables,
      uploadVariables,
      stageLists,
      uploadLists,
      lastRealSpriteId,
      addSprite,
      addSpriteFromLibrary,
      addSurpriseSprite,
      deleteSprite,
      updateSprite,
      updateSpriteBlocks,
      selectSprite,
      setSprites,
      setActiveSpriteId,
      getSpriteById,
      duplicateSprite,
      addCostumeToSprite,
      updateCostume,
      updateCostumeThumbnail,
      switchCostume,
      renameCostume,
      removeCostumeFromSprite,
      duplicateCostume,
      addSoundToSprite,
      switchSound,
      renameSound,
      removeSoundFromSprite,
      updateSoundData,
      playSound,
      addBackdrop,
      addBackdropFromLibrary,
      addSurpriseBackdrop,
      deleteBackdrop,
      selectBackdrop,
      setBackdrops,
      setActiveBackdropId,
      renameBackdrop,
      getUserVariables,
      addVariable,
      renameVariable,
      deleteVariable,
      forceSyncVariables,
      getUserLists,
      addList,
      renameList,
      deleteList,
      forceSyncLists,
      activeStageMLModel,
      setActiveStageMLModel,
      activeUploadMLModel,
      setActiveUploadMLModel,
      isRecognitionWindowOpen,
      setIsRecognitionWindowOpen,
      currentMLPredictions,
      setCurrentMLPredictions,
      monitors,
      setMonitorVisibility,
      updateMonitorValue,
      updateMonitorItems,
      updateMonitorPosition,
      getBroadcastMessages,
      addBroadcastMessage,
    ],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
}
