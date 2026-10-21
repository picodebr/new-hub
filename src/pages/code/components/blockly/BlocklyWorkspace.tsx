/**
 * Componente BlocklyWorkspace — Orquestrador.
 *
 * Este componente é responsável por:
 * 1. Orquestrar os hooks de inicialização, mode-switching e ML.
 * 2. Gerenciar estado local de modais e UI.
 * 3. Expor a API imperativa via forwardRef.
 * 4. Renderizar o layout (tabs, workspace div, modais).
 *
 * Toda lógica pesada foi extraída para:
 * - hooks/blockly/ (init, context menu, toolbox, variables, flyout, mode switch)
 * - config/blockly/ (theme, locale, workspace-options)
 * - components/blockly/ (BlocklyTabHeader, ExtensionButton, BlocklyModals)
 */

/**
 * Componente principal do workspace visual, integrando Blockly e React.
 */
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { useProject } from '@/_base/context/ProjectContext';
import { useUI } from '@/_base/context/UIContext';
import { IBlocklyWorkspaceJson, BlocklyWorkspaceRef, SpriteVariable } from '@/_base/domain/entities';

// Extracted hooks

// Extracted subcomponents
import { BlocklyTabHeader } from './BlocklyTabHeader';
import { ExtensionButton } from './ExtensionButton';
import { BlocklyModals } from './BlocklyModals';
import CostumeEditor from '../editors/CostumeEditor';
import SoundEditor from '../editors/SoundEditor';
import BackdropEditor from '../editors/BackdropEditor';
import { useStage } from '@/_base/context/RuntimeContext';
import { useBlocklyInit, useBlocklyModeSwitch, useBlocklyMotionSync } from '@/_base/hooks/Code/blockly';
import { syncFlyoutHighlights } from '@/_base/hooks/Code/blockly/useBlocklyFlyout';
import { arduinoGenerator } from '@/_base/generators/board';
import { getSpriteBlockRegistry } from '@/_base/vm/SpriteBlockRegistry';
// setupFlyoutMonitors removido em favor do Double-Click detector no setupFlyoutListeners

// =====================================
// TYPES
// =====================================

interface BlocklyWorkspaceProps {
  onBlockClick?: (code: string) => void;
  onRunCode?: (blockId: string, workspaceId: string) => void;
}

/**
 * Interface estendida para blocos que possuem métodos customizados.
 */
interface BlocklyBlock extends Blockly.Block {
  setHighlighted?: (highlighted: boolean) => void;
}

// Helper para envolver código com declarações de variáveis
function wrapCode(workspace: Blockly.WorkspaceSvg, code: string): string {
  let decls = '';
  const allVars = workspace.getVariableMap().getAllVariables();
  for (const v of allVars) {
    const varType = (v as unknown as { type: string }).type;
    // Ignora variáveis internas do Blockly (tipo vazio = variável de loop, etc)
    if (!varType) continue;
    const varName = (v as unknown as { name: string }).name || (v as unknown as { getId(): string }).getId();
    const safeName =
      (javascriptGenerator as unknown as { nameDB_?: { getName(n: string, t: unknown): string } }).nameDB_?.getName(
        varName,
        Blockly.Names.NameType.VARIABLE,
      ) || varName;
    decls += `if (window.__var_${safeName} === undefined) window.__var_${safeName} = 0;\n`;
  }
  return decls + code;
}

// =====================================
// COMPONENT
// =====================================

const BlocklyWorkspace = React.forwardRef<BlocklyWorkspaceRef, BlocklyWorkspaceProps>(({ onBlockClick, onRunCode }, ref) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  // --- CONTEXTS ---
  const {
    activeSpriteId,
    activeSprite,
    getSpriteById,
    updateSpriteBlocks,
    stageVariables,
    uploadVariables,
    renameVariable,
    deleteVariable,
    renameList,
    deleteList,
    getUserVariables,
    activeStageMLModel,
    activeUploadMLModel,
    monitors,
    setMonitorVisibility,
  } = useProject();

  const { isUploadMode, uploadModeBlocks, setUploadModeBlocks, setUploadCode } = useStage();

  // --- REFS ---
  const activeIdRef = useRef(activeSpriteId);
  const isUploadModeRef = useRef(isUploadMode);
  const onRunCodeRef = useRef(onRunCode);
  const onBlockClickRef = useRef(onBlockClick);

  useEffect(() => {
    activeIdRef.current = activeSpriteId;
  }, [activeSpriteId]);

  useEffect(() => {
    isUploadModeRef.current = isUploadMode;
  }, [isUploadMode]);
  useEffect(() => {
    onRunCodeRef.current = onRunCode;
  }, [onRunCode]);
  useEffect(() => {
    onBlockClickRef.current = onBlockClick;
  }, [onBlockClick]);

  // Refs para Monitoramento (Evita re-render / flicker)
  const monitorsRef = useRef(monitors);
  const activeSpriteNameRef = useRef(activeSprite?.name || activeSpriteId);

  useEffect(() => {
    monitorsRef.current = monitors;
  }, [monitors]);
  useEffect(() => {
    activeSpriteNameRef.current = activeSprite?.name || activeSpriteId;
  }, [activeSprite, activeSpriteId]);

  // --- MODAL STATE ---
  const [isVarModalOpen, setIsVarModalOpen] = React.useState(false);
  const [isVarDeleteModalOpen, setIsVarDeleteModalOpen] = React.useState(false);
  const [isListModalOpen, setIsListModalOpen] = React.useState(false);
  const [isListDeleteModalOpen, setIsListDeleteModalOpen] = React.useState(false);
  const [isProcModalOpen, setIsProcModalOpen] = React.useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = React.useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = React.useState(false);
  const [isMLModalOpen, setIsMLModalOpen] = React.useState(false);
  const { activeExtensions, setActiveExtensions, activeTab, setActiveTab } = useUI();
  const [preselectedVar, setPreselectedVar] = React.useState<string | null>(null);

  // =====================================
  // 1. REFS PARA DEPENDÊNCIAS CIRCULARES
  // =====================================
  const handleBlocklyEventsRef = useRef<(event: Blockly.Events.Abstract) => void>(() => {});

  // =====================================
  // 2. HOOKS DE ESTADO E INICIALIZAÇÃO
  // =====================================
  const { workspaceRef, workspace } = useBlocklyInit({
    blocklyDiv,
    isUploadMode,
    activeExtensions,
    setIsVarModalOpen,
    setIsVarDeleteModalOpen,
    setIsListModalOpen,
    setIsListDeleteModalOpen,
    setIsProcModalOpen,
    setIsBroadcastModalOpen,
    setIsExtensionModalOpen,
    setIsMLModalOpen,
    handleBlocklyEventsRef,
    isUploadModeRef,
    activeSpriteIdRef: activeIdRef,
    activeSpriteNameRef,
    onRunCodeRef,
    onBlockClickRef,
    monitorsRef,
    setMonitorVisibility,
  });

  const { isLoadingBlocks } = useBlocklyModeSwitch({
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
    activeSoundCount: activeSprite?.sounds?.length ?? 0,
  });

  useEffect(() => {
    if (!workspace || isUploadMode) return;
    syncFlyoutHighlights(workspace, monitorsRef, activeIdRef, activeSpriteNameRef);
  }, [workspace, isUploadMode, monitors, activeSpriteId]);

  const handleBlocklyEvents = useCallback(
    (event: Blockly.Events.Abstract) => {
      if (!workspaceRef.current) return;

      // Sincroniza apenas se o evento for do workspace principal.
      // Evita que mudanças no Flyout (caixa de ferramentas), disparadas por arraste no palco,
      // causem ressincronização do registry headless e matem threads em execução.
      if (event.workspaceId !== workspaceRef.current.id) return;

      if (event.type === Blockly.Events.BLOCK_DELETE) {
        const blockDeleteEvent = event as Blockly.Events.BlockDelete;
        const deletedBlockJson = blockDeleteEvent.oldJson;
        if (deletedBlockJson && deletedBlockJson.type && (deletedBlockJson.type as string).startsWith('custom_def_')) {
          const procId = (deletedBlockJson.type as string).replace('custom_def_', '');
          const callBlockType = 'custom_call_' + procId;

          const callBlocks = workspaceRef.current.getAllBlocks(false).filter((b) => b.type === callBlockType);
          setTimeout(() => {
            callBlocks.forEach((block) => block.dispose(false));
          }, 0);
        }
      }

      if (
        event.type === Blockly.Events.BLOCK_CREATE ||
        event.type === Blockly.Events.BLOCK_CHANGE ||
        event.type === Blockly.Events.BLOCK_MOVE ||
        event.type === Blockly.Events.BLOCK_DELETE
      ) {
        if (isLoadingBlocks.current) return;
        if (event.isUiEvent) return;

        const json = Blockly.serialization.workspaces.save(workspaceRef.current) as unknown as IBlocklyWorkspaceJson;
        const blocksJson: IBlocklyWorkspaceJson = {
          blocks: json.blocks || { languageVersion: 0, blocks: [] },
          variables: json.variables,
        };

        if (isUploadModeRef.current) {
          const code = arduinoGenerator.workspaceToCode(workspaceRef.current);
          setUploadModeBlocks(blocksJson);
          setUploadCode(code);
        } else {
          const code = javascriptGenerator.workspaceToCode(workspaceRef.current);

          const allVariables = workspaceRef.current.getVariableMap().getAllVariables();
          const variables: SpriteVariable[] = (allVariables as unknown as { name: string; id: string; type: string; getId?: () => string }[])
            .filter((v) => v.type !== '' && v.type !== undefined)
            .map((v) => {
              const existingVar = (isUploadModeRef.current ? uploadVariables : stageVariables).find((ev) => ev.name === v.name);
              return {
                id: v.getId ? v.getId() : v.id,
                name: v.name,
                type: v.type || '',
                value: existingVar ? existingVar.value : v.type === 'Number' ? 0 : '',
                isGlobal: existingVar ? existingVar.isGlobal : false,
                ownerId: existingVar ? existingVar.ownerId : activeIdRef.current,
              };
            });

          updateSpriteBlocks(activeIdRef.current, blocksJson, code, variables);

          // Mantém o registry em sincronia imediata (equivalente ao target.blocks do Scratch).
          // Garante que a próxima execução encontre os hat blocks atualizados sem deserializar JSON.
          getSpriteBlockRegistry().syncFromJson(activeIdRef.current, blocksJson);
        }
      }

      if (event.type === Blockly.Events.VAR_DELETE) {
        const varEvent = event as Blockly.Events.VarDelete;
        const varName = varEvent.varName;
        const varType = varEvent.varType;

        if (varName) {
          const mode = isUploadModeRef.current ? 'upload' : 'stage';
          if (varType === 'list') {
            deleteList(mode, varName);
          } else {
            deleteVariable(mode, varName);
          }
        }
      }

      if (event.type === Blockly.Events.VAR_RENAME) {
        const varEvent = event as Blockly.Events.VarRename;
        const oldName = varEvent.oldName;
        const newName = varEvent.newName;
        const varId = varEvent.varId;

        if (oldName && newName) {
          const mode = isUploadModeRef.current ? 'upload' : 'stage';
          const variable = varId ? workspaceRef.current.getVariableById(varId) : null;
          const varType = variable ? (variable as unknown as { type: string }).type : undefined;

          if (varType === 'list') {
            renameList(mode, oldName, newName);
          } else {
            renameVariable(mode, oldName, newName);
          }
        }
      }
    },
    [
      workspaceRef,
      isLoadingBlocks,
      updateSpriteBlocks,
      stageVariables,
      uploadVariables,
      deleteVariable,
      renameVariable,
      deleteList,
      renameList,
      setUploadModeBlocks,
      setUploadCode,
    ],
  );

  useEffect(() => {
    handleBlocklyEventsRef.current = handleBlocklyEvents;
  }, [handleBlocklyEvents]);

  useEffect(() => {
    if (activeTab === 'code' && workspaceRef.current) {
      const timer = setTimeout(() => {
        if (workspaceRef.current) {
          Blockly.svgResize(workspaceRef.current);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, workspaceRef]);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (typeof document === 'undefined') return;
      const toolbox = document.querySelector('.blocklyToolboxDiv');
      if (toolbox) {
        const width = (toolbox as HTMLElement).offsetWidth;
        if (width > 0) {
          document.documentElement.style.setProperty('--toolbox-width', `${width}px`);
        }
      }
    };

    const setupObserver = () => {
      const toolbox = document.querySelector('.blocklyToolboxDiv');
      if (toolbox && !resizeObserverRef.current) {
        const ro = new ResizeObserver(updateWidth);
        ro.observe(toolbox);
        resizeObserverRef.current = ro;
        updateWidth();
      }
    };

    setupObserver();

    const mutObserver = new MutationObserver(() => {
      setupObserver();
      updateWidth();
    });

    mutObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutObserver.disconnect();
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, []);

  // =====================================
  // IMPERATIVE HANDLE
  // =====================================
  React.useImperativeHandle(ref, () => ({
    setBlockHighlight: (blockId: string, highlighted: boolean) => {
      if (!workspaceRef.current) return;
      let block = workspaceRef.current.getBlockById(blockId);

      // Se não encontrou no workspace principal, procura no flyout (toolbox)
      if (!block) {
        const flyout = workspaceRef.current.getFlyout?.() || (workspaceRef.current as any).getToolbox?.()?.getFlyout?.();
        const flyoutWs = flyout?.getWorkspace?.();
        if (flyoutWs) {
          block = flyoutWs.getBlockById(blockId);
        }
      }

      if (block && (block as BlocklyBlock).setHighlighted) {
        try {
          (block as BlocklyBlock).setHighlighted!(highlighted);
        } catch (e) {
          console.warn(`[BlocklyWorkspace] Erro ao destacar bloco ${blockId}:`, e);
        }
      }
    },

    generateCodeForBlock: (blockId: string) => {
      if (!workspaceRef.current || isUploadModeRef.current) return null;
      const block = workspaceRef.current.getBlockById(blockId);
      if (!block) return null;

      if ((javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init) {
        (javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init(workspaceRef.current);
      }

      if (block.type.startsWith('custom_def_')) {
        const defCode = javascriptGenerator.blockToCode(block);
        const prototype = block.getInputTargetBlock('PROTOTYPE');
        if (prototype) {
          const funcName = prototype.getFieldValue('NAME');
          const safeFuncName = (javascriptGenerator as any).nameDB_?.getName(funcName, Blockly.Names.NameType.PROCEDURE);

          const args: string[] = [];
          prototype.inputList.forEach((input) => {
            if (input.name.startsWith('ARG_')) {
              const target = input.connection?.targetBlock();
              if (target) {
                if (target.type === 'argument_reporter_number') args.push('0');
                else if (target.type === 'argument_reporter_boolean') args.push('false');
                else args.push('""');
              }
            }
          });

          const callCode = `await ${safeFuncName}(${args.join(', ')});`;
          return defCode + '\n' + callCode;
        }
      }

      let extraDefs = '';
      if (block.type.startsWith('custom_call_')) {
        const allBlocks = workspaceRef.current.getTopBlocks(false);
        for (const potentialDef of allBlocks) {
          if (potentialDef.type.startsWith('custom_def_')) {
            const defCode = javascriptGenerator.blockToCode(potentialDef);
            extraDefs += defCode + '\n';
          }
        }
      }

      const rawCode = (extraDefs + javascriptGenerator.blockToCode(block)) as string;
      return wrapCode(workspaceRef.current, rawCode);
    },

    checkGreenFlagEvents: () => {
      if (!workspaceRef.current || isUploadModeRef.current) return null;
      const workspace = workspaceRef.current;
      if ((javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init) {
        (javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init(workspace);
      }

      const topBlocks = workspace.getTopBlocks(false);
      let definitions = '';
      for (const block of topBlocks) {
        if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn' || block.type.startsWith('custom_def_')) {
          const defCode = javascriptGenerator.blockToCode(block);
          if (defCode && typeof defCode === 'string') {
            definitions += defCode + '\n';
          }
        }
      }

      let combinedCode = '';
      const handlers: string[] = [];
      for (const block of topBlocks) {
        if (block.type === 'when_play_clicked') {
          const nextBlock = block.getNextBlock();
          if (nextBlock) {
            const code = javascriptGenerator.blockToCode(nextBlock);
            if (code && typeof code === 'string') {
              handlers.push(`(async () => {\n${code}\n})()`);
            }
          }
        }
      }

      if (handlers.length > 0) {
        combinedCode = `await Promise.all([\n  ${handlers.join(',\n  ')}\n]);`;
      }

      for (const block of topBlocks) {
        if (block.type === 'event_when_key_pressed') {
          const code = javascriptGenerator.blockToCode(block);
          if (code && typeof code === 'string') {
            combinedCode += code + '\n';
          }
        }
      }

      if (!combinedCode) return null;
      return wrapCode(workspace, definitions + '\n' + combinedCode);
    },

    checkMLPredictionEvents: (className: string) => {
      if (!workspaceRef.current || isUploadModeRef.current) return null;
      const workspace = workspaceRef.current;
      if ((javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init) {
        (javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init(workspace);
      }

      const topBlocks = workspace.getTopBlocks(false);
      const scripts: Array<{ hatId: string; code: string }> = [];

      let definitions = '';
      for (const block of topBlocks) {
        if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn' || block.type.startsWith('custom_def_')) {
          const defCode = javascriptGenerator.blockToCode(block);
          if (defCode && typeof defCode === 'string') {
            definitions += defCode + '\n';
          }
        }
      }

      for (const block of topBlocks) {
        if (block.type === 'ml_when_predicted') {
          const blockClass = block.getFieldValue('CLASS');
          if (blockClass === className) {
            const nextBlock = block.getNextBlock();
            if (nextBlock) {
              const code = javascriptGenerator.blockToCode(nextBlock);
              if (code && typeof code === 'string') {
                scripts.push({
                  hatId: `ml_${className.toLowerCase()}_${block.id}`,
                  code: wrapCode(workspace, definitions + '\n' + code),
                });
              }
            }
          }
        }
      }

      return scripts.length > 0 ? scripts : null;
    },

    checkCloneEvents: () => {
      if (!workspaceRef.current || isUploadModeRef.current) return null;
      const workspace = workspaceRef.current;
      if ((javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init) {
        (javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init(workspace);
      }

      const topBlocks = workspace.getTopBlocks(false);
      const scripts: Array<{ hatId: string; code: string }> = [];

      let definitions = '';
      for (const block of topBlocks) {
        if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn' || block.type.startsWith('custom_def_')) {
          const defCode = javascriptGenerator.blockToCode(block);
          if (defCode && typeof defCode === 'string') {
            definitions += defCode + '\n';
          }
        }
      }

      for (const block of topBlocks) {
        if (block.type === 'control_start_as_clone') {
          const nextBlock = block.getNextBlock();
          if (nextBlock) {
            const code = javascriptGenerator.blockToCode(nextBlock);
            if (code && typeof code === 'string') {
              scripts.push({
                hatId: `clone_start_${block.id}`,
                code: wrapCode(workspace, definitions + '\n' + code),
              });
            }
          }
        }
      }

      return scripts.length > 0 ? scripts : null;
    },

    checkMessageEvents: (message: string) => {
      if (!workspaceRef.current || isUploadModeRef.current) return null;

      const workspace = workspaceRef.current;
      if ((javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init) {
        (javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init(workspace);
      }

      const topBlocks = workspace.getTopBlocks(false);
      const scripts: Array<{ hatId: string; code: string }> = [];

      let definitions = '';
      for (const block of topBlocks) {
        if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn' || block.type.startsWith('custom_def_')) {
          const defCode = javascriptGenerator.blockToCode(block);
          if (defCode && typeof defCode === 'string') {
            definitions += defCode + '\n';
          }
        }
      }

      for (const block of topBlocks) {
        if (block.type === 'quando_receber') {
          const blockMsg = block.getFieldValue('MENSAGEM');
          if (blockMsg === message) {
            const nextBlock = block.getNextBlock();
            if (nextBlock) {
              const code = javascriptGenerator.blockToCode(nextBlock);
              if (code && typeof code === 'string') {
                scripts.push({
                  hatId: `broadcast_${message}_${block.id}`,
                  code: wrapCode(workspace, definitions + '\n' + code),
                });
              }
            }
          }
        }
      }

      return scripts.length > 0 ? scripts : null;
    },

    checkBackdropEvents: (backdropName: string) => {
      if (!workspaceRef.current || isUploadModeRef.current) return null;

      const workspace = workspaceRef.current;
      if ((javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init) {
        (javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init(workspace);
      }

      const topBlocks = workspace.getTopBlocks(false);
      const scripts: Array<{ hatId: string; code: string }> = [];

      let definitions = '';
      for (const block of topBlocks) {
        if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn' || block.type.startsWith('custom_def_')) {
          const defCode = javascriptGenerator.blockToCode(block);
          if (defCode && typeof defCode === 'string') {
            definitions += defCode + '\n';
          }
        }
      }

      for (const block of topBlocks) {
        if (block.type === 'event_when_backdrop_switches_to') {
          const blockBackdrop = block.getFieldValue('BACKDROP');
          if (blockBackdrop === backdropName) {
            const nextBlock = block.getNextBlock();
            if (nextBlock) {
              const code = javascriptGenerator.blockToCode(nextBlock);
              if (code && typeof code === 'string') {
                scripts.push({
                  hatId: `backdrop_${backdropName}_${block.id}`,
                  code: wrapCode(workspace, definitions + '\n' + code),
                });
              }
            }
          }
        }
      }

      return scripts.length > 0 ? scripts : null;
    },

    checkStageClickEvents: () => {
      if (!workspaceRef.current || isUploadModeRef.current) return null;
      const workspace = workspaceRef.current;
      if ((javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init) {
        (javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init(workspace);
      }

      const topBlocks = workspace.getTopBlocks(false);
      const scripts: Array<{ hatId: string; code: string }> = [];

      let definitions = '';
      for (const block of topBlocks) {
        if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn' || block.type.startsWith('custom_def_')) {
          const defCode = javascriptGenerator.blockToCode(block);
          if (defCode && typeof defCode === 'string') {
            definitions += defCode + '\n';
          }
        }
      }

      for (const block of topBlocks) {
        if (block.type === 'event_whenstageclicked') {
          const nextBlock = block.getNextBlock();
          if (nextBlock) {
            const code = javascriptGenerator.blockToCode(nextBlock);
            if (code && typeof code === 'string') {
              scripts.push({
                hatId: `stage_clicked_${block.id}`,
                code: wrapCode(workspace, definitions + '\n' + code),
              });
            }
          }
        }
      }

      return scripts.length > 0 ? scripts : null;
    },

    checkSpriteClickEvents: () => {
      if (!workspaceRef.current || isUploadModeRef.current) return null;
      const workspace = workspaceRef.current;
      if ((javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init) {
        (javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init(workspace);
      }

      const topBlocks = workspace.getTopBlocks(false);
      const scripts: Array<{ hatId: string; code: string }> = [];

      let definitions = '';
      for (const block of topBlocks) {
        if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn' || block.type.startsWith('custom_def_')) {
          const defCode = javascriptGenerator.blockToCode(block);
          if (defCode && typeof defCode === 'string') {
            definitions += defCode + '\n';
          }
        }
      }

      for (const block of topBlocks) {
        if (block.type === 'when_sprite_clicked') {
          const nextBlock = block.getNextBlock();
          if (nextBlock) {
            const code = javascriptGenerator.blockToCode(nextBlock);
            if (code && typeof code === 'string') {
              scripts.push({
                hatId: `sprite_clicked_${block.id}`,
                code: wrapCode(workspace, definitions + '\n' + code),
              });
            }
          }
        }
      }

      return scripts.length > 0 ? scripts : null;
    },

    checkKeyEvents: (key: string) => {
      if (!workspaceRef.current || isUploadModeRef.current) return null;

      const workspace = workspaceRef.current;
      if ((javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init) {
        (javascriptGenerator as unknown as { init: (w: Blockly.Workspace) => void }).init(workspace);
      }

      const topBlocks = workspace.getTopBlocks(false);
      let combinedCode = '';

      let definitions = '';
      for (const block of topBlocks) {
        if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn' || block.type.startsWith('custom_def_')) {
          const defCode = javascriptGenerator.blockToCode(block);
          if (defCode && typeof defCode === 'string') {
            definitions += defCode + '\n';
          }
        }
      }

      const handlers: string[] = [];
      for (const block of topBlocks) {
        if (block.type === 'event_when_key_pressed') {
          const keyOption = block.getFieldValue('KEY_OPTION');

          let isMatch = false;
          if (keyOption === 'any') isMatch = true;
          else if (keyOption === key) isMatch = true;
          else if (keyOption === 'space' && key === ' ') isMatch = true;
          else if (keyOption === 'up arrow' && key === 'ArrowUp') isMatch = true;
          else if (keyOption === 'down arrow' && key === 'ArrowDown') isMatch = true;
          else if (keyOption === 'right arrow' && key === 'ArrowRight') isMatch = true;
          else if (keyOption === 'left arrow' && key === 'ArrowLeft') isMatch = true;
          else if (keyOption === 'enter' && key === 'Enter') isMatch = true;
          else if (keyOption.toLowerCase() === key.toLowerCase()) isMatch = true;

          if (isMatch) {
            const nextBlock = block.getNextBlock();
            if (nextBlock) {
              const code = javascriptGenerator.blockToCode(nextBlock);
              if (code && typeof code === 'string') {
                handlers.push(`(async () => {\n${code}\n})()`);
              }
            }
          }
        }
      }

      if (handlers.length > 0) {
        combinedCode = `await Promise.all([\n  ${handlers.join(',\n  ')}\n]);`;
      }

      if (!combinedCode) return null;
      return wrapCode(workspace, definitions + '\n' + combinedCode);
    },

    flushActiveWorkspace: () => {
      const ws = workspaceRef.current;
      if (!ws || isLoadingBlocks.current || isUploadModeRef.current) return;
      const json = Blockly.serialization.workspaces.save(ws) as unknown as IBlocklyWorkspaceJson;
      const blocksJson: IBlocklyWorkspaceJson = {
        blocks: json.blocks || { languageVersion: 0, blocks: [] },
        variables: json.variables,
      };
      const code = javascriptGenerator.workspaceToCode(ws);
      updateSpriteBlocks(activeIdRef.current, blocksJson, code);
    },

    undo: () => {
      if (workspaceRef.current) workspaceRef.current.undo(false);
    },
    redo: () => {
      if (workspaceRef.current) workspaceRef.current.undo(true);
    },
    getWorkspace: () => workspaceRef.current,
  }));

  useBlocklyMotionSync(workspaceRef, activeSprite, isUploadMode);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {!isUploadMode && <BlocklyTabHeader activeTab={activeTab} onTabChange={(tab) => { workspaceRef.current?.hideChaff(); setActiveTab(tab); }} isStage={activeSpriteId === 'stage'} />}

      <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden', minHeight: 0, backgroundColor: '#e9eef2' }}>
        <div
          id="blockly-injection-container"
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            flexDirection: 'row',
            borderRadius: '0 16px 0 0',
            backgroundColor: '#fff',
            borderTop: '1px solid #ccc',
            borderRight: '1px solid #ccc',
            borderLeft: 'none',
            borderBottom: 'none',
            zIndex: activeTab === 'code' || isUploadMode ? 10 : 1,
            visibility: activeTab === 'code' || isUploadMode ? 'visible' : 'hidden',
          }}
        >
          <div
            ref={blocklyDiv}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          />

          <ExtensionButton onClick={() => setIsExtensionModalOpen(true)} />
        </div>

        {!isUploadMode && (
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              inset: 0,
              display: 'flex',
              minHeight: 0,
              overflow: 'hidden',
              borderTop: '1px solid #ccc',
              borderRight: '1px solid #ccc',
              borderLeft: 'none',
              borderBottom: 'none',
              borderRadius: '0 16px 0 0',
              zIndex: activeTab === 'costumes' ? 10 : 1,
              visibility: activeTab === 'costumes' ? 'visible' : 'hidden',
            }}
          >
            {activeSpriteId === 'stage' ? <BackdropEditor /> : <CostumeEditor />}
          </div>
        )}

        {!isUploadMode && (
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              inset: 0,
              display: 'flex',
              minHeight: 0,
              overflow: 'hidden',
              backgroundColor: '#f0f0f0',
              borderTop: '1px solid #ccc',
              borderRight: '1px solid #ccc',
              borderLeft: 'none',
              borderBottom: 'none',
              borderRadius: '0 16px 0 0',
              zIndex: activeTab === 'sounds' ? 10 : 1,
              visibility: activeTab === 'sounds' ? 'visible' : 'hidden',
            }}
          >
            <div className="flex-1 d-flex">
              <SoundEditor />
            </div>
          </div>
        )}
      </div>

      {isMounted && (
        <BlocklyModals
          workspace={workspace}
          isUploadMode={isUploadMode}
          isVarModalOpen={isVarModalOpen}
          setIsVarModalOpen={setIsVarModalOpen}
          isVarDeleteModalOpen={isVarDeleteModalOpen}
          setIsVarDeleteModalOpen={setIsVarDeleteModalOpen}
          preselectedVar={preselectedVar}
          setPreselectedVar={setPreselectedVar}
          isListModalOpen={isListModalOpen}
          setIsListModalOpen={setIsListModalOpen}
          isListDeleteModalOpen={isListDeleteModalOpen}
          setIsListDeleteModalOpen={setIsListDeleteModalOpen}
          isProcModalOpen={isProcModalOpen}
          setIsProcModalOpen={setIsProcModalOpen}
          isExtensionModalOpen={isExtensionModalOpen}
          setIsExtensionModalOpen={setIsExtensionModalOpen}
          activeExtensions={activeExtensions}
          setActiveExtensions={setActiveExtensions}
          isMLModalOpen={isMLModalOpen}
          setIsMLModalOpen={setIsMLModalOpen}
          isBroadcastModalOpen={isBroadcastModalOpen}
          setIsBroadcastModalOpen={setIsBroadcastModalOpen}
        />
      )}
    </div>
  );
});

BlocklyWorkspace.displayName = 'BlocklyWorkspace';

export default BlocklyWorkspace;
