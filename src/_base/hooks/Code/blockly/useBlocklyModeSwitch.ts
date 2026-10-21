/**
 * Hook: useBlocklyModeSwitch
 *
 * Responsabilidades:
 * 1. Troca de modo (Stage ↔ Upload) com save/load de blocos
 * 2. Troca de sprite ativo com save/load de blocos
 * 3. Sincronização não-destrutiva de variáveis
 * 4. Atualização da toolbox ao trocar de modo
 */

/**
 * Lógica de transição entre os modos Palco (JS) e Placa (C++).
 */
import { useEffect, useRef, useState, RefObject } from 'react';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { SpriteData, IMLModel, IBlocklyWorkspaceJson, SpriteVariable } from '@/_base/domain/entities';
import { getProjectService } from '@/_base/services/code';
import { getStageToolbox, getUploadToolbox } from '@/_base/config/toolbox/index';
import { applyCustomCategoryIcons } from '@/_base/lib/blockly/categories';

export interface UseBlocklyModeSwitchParams {
  workspaceRef: RefObject<Blockly.WorkspaceSvg | null>;
  workspace?: Blockly.WorkspaceSvg | null;
  activeSpriteId: string;
  isUploadMode: boolean;
  activeExtensions: string[];
  activeStageMLModel: IMLModel | null;
  activeUploadMLModel: IMLModel | null;
  // Project context
  getSpriteById: (id: string) => SpriteData | undefined;
  updateSpriteBlocks: (spriteId: string, json: IBlocklyWorkspaceJson, code: string, variables?: SpriteVariable[]) => void;
  uploadModeBlocks: IBlocklyWorkspaceJson | null;
  // Variables
  stageVariables: SpriteVariable[];
  uploadVariables: SpriteVariable[];
  getUserVariables: (mode: 'stage' | 'upload') => SpriteVariable[];
  activeSoundCount?: number;
}

export function useBlocklyModeSwitch(params: UseBlocklyModeSwitchParams) {
  const {
    workspaceRef,
    workspace,
    activeSpriteId,
    isUploadMode,
    activeExtensions,
    activeStageMLModel,
    activeUploadMLModel,
    getSpriteById,
    updateSpriteBlocks,
    uploadModeBlocks,
    stageVariables,
    uploadVariables,
    getUserVariables,
    activeSoundCount = 0,
  } = params;

  const [isTransitioning, setIsTransitioning] = useState(false);
  const isLoadingBlocks = useRef(false);
  const previousSpriteIdRef = useRef<string>(activeSpriteId);
  const previousModeRef = useRef<boolean>(isUploadMode);

  // Contador para forçar re-render quando um projeto é carregado externamente
  const [loadProjectCounter, setLoadProjectCounter] = useState(0);

  // Armazena scrollX, scrollY e scale para cada sprite ou modo
  const viewStatesRef = useRef<Record<string, { x: number; y: number; scale: number }>>({});

  // Refs para evitar re-execução do efeito principal por mudanças nos dados de blocos (evita loops)
  const uploadModeBlocksRef = useRef(uploadModeBlocks);
  const updateSpriteBlocksRef = useRef(updateSpriteBlocks);
  const getSpriteByIdRef = useRef(getSpriteById);

  // Sincroniza refs
  useEffect(() => {
    uploadModeBlocksRef.current = uploadModeBlocks;
    updateSpriteBlocksRef.current = updateSpriteBlocks;
    getSpriteByIdRef.current = getSpriteById;
  }, [uploadModeBlocks, updateSpriteBlocks, getSpriteById]);

  // Detectadores de mudança de modelo ML (para evitar re-loads desnecessários)
  useEffect(() => {
    const projectService = getProjectService();
    const handleProjectLoaded = () => {
      console.log('[useBlocklyModeSwitch] Projeto carregado! Forçando atualização do workspace.');
      setLoadProjectCounter((prev) => prev + 1);
    };
    projectService.on('projectLoaded', handleProjectLoaded);
    return () => projectService.off('projectLoaded', handleProjectLoaded);
  }, []);

  // --- 1. EFEITO DE CARGA DE BLOCOS (DESTRUTIVO) ---
  // Dispara apenas quando mudamos o "que" estamos editando (Ator ou Modo)
  useEffect(() => {
    const currentWs = workspace || workspaceRef.current;
    if (currentWs) {
      // Se o alvo for o palco, agora permitimos a carga de blocos próprios do palco.
      const isStageSelected = activeSpriteId === 'stage' && !isUploadMode;

      setIsTransitioning(true);
      isLoadingBlocks.current = true;

      const timeoutId = setTimeout(() => {
        const ws = workspace || workspaceRef.current;
        if (!ws || (ws as unknown as { disposed: boolean }).disposed || !ws.rendered) return;

        try {
          ws.hideChaff();
          // Bloqueia eventos para evitar loops e erros de sincronização durante a troca
          Blockly.Events.disable();

          // 1. Atualiza a Toolbox ANTES de limpar/carregar blocos (Sincroniza UI)
          const isStageSelected = activeSpriteId === 'stage' && !isUploadMode;
          const newToolbox = isUploadMode
            ? getUploadToolbox(activeExtensions, !!activeUploadMLModel)
            : getStageToolbox(activeExtensions, isStageSelected, !!activeStageMLModel);

          ws.updateToolbox(newToolbox);
          // O applyCustomCategoryIcons agora é chamado ao final, após o refreshSelection

          // 2. Salva o estado anterior antes de trocar (se mudou de sprite no stage mode)
          if (previousSpriteIdRef.current && previousSpriteIdRef.current !== activeSpriteId && !isUploadMode) {
            const json = Blockly.serialization.workspaces.save(ws) as IBlocklyWorkspaceJson;
            const code = javascriptGenerator.workspaceToCode(ws);
            updateSpriteBlocksRef.current(previousSpriteIdRef.current, json, code);
          }

          // Salva o estado atual do workspace (Pode ser do modo anterior ou sprite anterior)
          const currentKey = previousModeRef.current ? 'upload' : `sprite_${previousSpriteIdRef.current}`;
          if (ws && !(ws as unknown as { disposed: boolean }).disposed) {
            viewStatesRef.current[currentKey] = {
              x: ws.scrollX,
              y: ws.scrollY,
              scale: ws.scale,
            };
          }

          previousSpriteIdRef.current = activeSpriteId;
          previousModeRef.current = isUploadMode;
          ws.clear();

          // 3. Reinjeta variáveis do ProjectService no workspace ANTES de carregar blocos
          // Isso garante que blocos com referência a variáveis encontrem seus IDs corretos
          const mode = isUploadMode ? 'upload' : 'stage';
          const targetVars = getProjectService().getUserVariables(mode, activeSpriteId);
          const varMap = ws.getVariableMap();
          targetVars.forEach((v) => {
            if (!varMap.getVariable(v.name, v.type)) {
              varMap.createVariable(v.name, v.type, v.id);
            }
          });

          // 4. Carrega novos blocos (com variáveis já presentes no workspace)
          if (isUploadMode) {
            const hasBlocks =
              uploadModeBlocksRef.current &&
              uploadModeBlocksRef.current.blocks &&
              uploadModeBlocksRef.current.blocks.blocks &&
              uploadModeBlocksRef.current.blocks.blocks.length > 0;

            if (hasBlocks) {
              const cleanJson = { ...uploadModeBlocksRef.current } as Partial<IBlocklyWorkspaceJson>;
              Blockly.serialization.workspaces.load(cleanJson as IBlocklyWorkspaceJson, ws);
            } else {
              // Cria blocos setup e loop padrão
              const setup = ws.newBlock('setup_block');
              if (setup) {
                setup.initSvg();
                setup.render();
                setup.moveBy(60, 40);
                setup.setDeletable(false);
              }
              const loop = ws.newBlock('loop_block');
              if (loop) {
                loop.initSvg();
                loop.render();
                loop.moveBy(360, 40);
                loop.setDeletable(false);
              }
            }
          } else {
            const spriteData =
              activeSpriteId === 'stage' ? { blocks: getProjectService().getStageBlocks().blocks } : getSpriteByIdRef.current(activeSpriteId);

            const finalSpriteData =
              activeSpriteId === 'stage' ? ({ blocks: getProjectService().getStageBlocks().blocks } as unknown as SpriteData) : spriteData;

            if (finalSpriteData && finalSpriteData.blocks) {
              const cleanJson = { ...finalSpriteData.blocks } as Partial<IBlocklyWorkspaceJson>;
              Blockly.serialization.workspaces.load(cleanJson as IBlocklyWorkspaceJson, ws);
            }
          }

          // 4. Restaura estado de zoom e pan
          const newKey = isUploadMode ? 'upload' : `sprite_${activeSpriteId}`;
          const savedState = viewStatesRef.current[newKey];
          if (ws && savedState) {
            ws.setScale(savedState.scale);
            ws.scroll(savedState.x, savedState.y);
          } else if (ws) {
            const currentScale = ws.scale || 0.5; // Scale padrão Flyout/Scratch
            ws.setScale(currentScale);
            ws.scroll(60, 20); // Margem inicial
          }

          // 5. Finaliza UI (Toolbox e Resize)
          const toolbox = ws.getToolbox();
          if (toolbox) {
            // Patch scale do Flyout
            const flyout = toolbox.getFlyout();
            if (flyout) {
              // @ts-expect-error - getFlyoutScale is not in the type definition but used in Scratch-style workspaces
              flyout.getFlyoutScale = () => 0.6;
            }
            toolbox.refreshSelection();
            // Primeiro reforço imediato após a seleção
            setTimeout(applyCustomCategoryIcons, 0);
          }

          Blockly.svgResize(ws);
          ws.render();
        } catch (e) {
          console.error('[BlocklyWorkspace] Error switching mode:', e);
        } finally {
          Blockly.Events.enable();
          isLoadingBlocks.current = false;
          // Segundo reforço final para garantir que qualquer transição de UI/DOM terminou
          setTimeout(applyCustomCategoryIcons, 100);
          setTimeout(() => setIsTransitioning(false), 50);
        }
      }, 80);

      return () => clearTimeout(timeoutId);
    }
  }, [workspace, isUploadMode, activeSpriteId, activeExtensions, activeStageMLModel, activeUploadMLModel, workspaceRef, loadProjectCounter, uploadModeBlocks]);

  // --- 2. EFEITO DE SINCRONIZAÇÃO DE VARIÁVEIS (NÃO-DESTRUTIVO) ---
  // Apenas garante que as variáveis do ProjectService existam no workspace
  const lastVarsRef = useRef<string>('');
  useEffect(() => {
    if (workspaceRef.current && !isLoadingBlocks.current) {
      const mode = isUploadMode ? 'upload' : 'stage';
      const targetVars = getUserVariables(mode);

      // Verificação de mudança estrutural (nome ou tipo) para evitar loops e flickering via eventos de workspace
      const varsFingerprint = JSON.stringify(targetVars.map((v) => ({ n: v.name, t: v.type })));
      if (lastVarsRef.current === varsFingerprint) return;
      lastVarsRef.current = varsFingerprint;

      const varMap = workspaceRef.current.getVariableMap();
      let changed = false;

      targetVars.forEach((v) => {
        if (!varMap.getVariable(v.name)) {
          varMap.createVariable(v.name, v.type);
          changed = true;
        }
      });

      // Atualiza toolbox para refletir apenas se a estrutura mudou
      if (changed) {
        const toolbox = workspaceRef.current.getToolbox();
        if (toolbox) {
          toolbox.refreshSelection();
        }
      }
    }
    // Nota: Removemos stageVariables e uploadVariables da dependência direta do useEffect!
    // Agora dependemos apenas do fingerprint calculado no render ou internamente.
    // Como o ProjectContext atualiza o componente pai (BlocklyWorkspace) a cada mudança de variável,
    // este effect continuará rodando, mas o 'if' acima bloqueará o refresh da toolbox se o valor for a única mudança.
  }, [
    isUploadMode,
    getUserVariables,
    workspaceRef,
    stageVariables.length,
    uploadVariables.length,
    // Forçamos a execução do effect apenas se a QUANTIDADE de variáveis mudar, ou se o modo mudar.
    // O fingerprint interno cuidará de mudanças de NOME ou TIPO (renomear).
  ]);

  // --- 3. EFEITO DE SINCRONIZAÇÃO DE SONS (NÃO-DESTRUTIVO) ---
  // Quando sons são adicionados/removidos do sprite ativo, refresha a toolbox
  // para que o menuGenerator_ dos blocos de som mostre as opções atualizadas.
  const lastSoundCountRef = useRef<number>(activeSoundCount);
  useEffect(() => {
    if (lastSoundCountRef.current === activeSoundCount) return;
    lastSoundCountRef.current = activeSoundCount;

    if (workspaceRef.current && !isLoadingBlocks.current) {
      const toolbox = workspaceRef.current.getToolbox();
      if (toolbox) {
        toolbox.refreshSelection();
      }
    }
  }, [activeSoundCount, workspaceRef, isLoadingBlocks]);

  return {
    isTransitioning,
    isLoadingBlocks,
    previousSpriteIdRef,
  };
}
