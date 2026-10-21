/**
 * useBlocklySync - Sincronizador em tempo real entre UI Visual e Código Gerado.
 *
 * Responsabilidade: Garantir a integridade entre o workspace visual (blocos)
 * e o repositório central de dados. Gerencia a carga e persistência de JSON
 * de blocos ao trocar de atores/modos e dispara a regeneração de código
 * (JS e Arduino) em resposta a cada mudança estrutural.
 *
 * Operações Principais:
 * - handleBlocklyEvents: Captura orquestrada de mudanças para salvamento e tradução.
 * - Sincronização de variáveis de usuário entre o motor visual e o ProjectContext.
 */
import { ExtendedWorkspace, IBlocklyWorkspaceJson, SpriteData, SpriteVariable } from '@/_base/domain/entities';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { useEffect, useRef, useCallback } from 'react';
import { arduinoGenerator } from '../../generators/board';
import { applyCustomCategoryIcons } from '@/_base/lib/blockly/categories';
import { ToolboxDefinition, ToolboxUploadDefinition } from '@/_base/config/toolbox';

interface UseBlocklySyncProps {
  workspaceRef: React.RefObject<Blockly.WorkspaceSvg | null>;
  activeSpriteId: string;
  isUploadMode: boolean;
  getSpriteById: (id: string) => SpriteData | undefined;
  updateSpriteBlocks: (id: string, blocks: IBlocklyWorkspaceJson, code: string, variables?: SpriteVariable[]) => void;
  stageVariables: SpriteVariable[];
  uploadVariables: SpriteVariable[];
  uploadModeBlocks: IBlocklyWorkspaceJson | null;
  setUploadModeBlocks: (blocks: IBlocklyWorkspaceJson | null) => void;
  setUploadCode: (code: string) => void;
  deleteVariable: (mode: 'stage' | 'upload', name: string) => void;
  renameVariable: (mode: 'stage' | 'upload', oldName: string, newName: string) => void;
  getUserVariables: (mode: 'stage' | 'upload') => SpriteVariable[];
}

export function useBlocklySync({
  workspaceRef,
  activeSpriteId,
  isUploadMode,
  getSpriteById,
  updateSpriteBlocks,
  stageVariables,
  uploadVariables,
  uploadModeBlocks,
  setUploadModeBlocks,
  setUploadCode,
  deleteVariable,
  renameVariable,
  getUserVariables,
}: UseBlocklySyncProps) {
  const isLoadingBlocks = useRef(false);
  const isUploadModeRef = useRef(isUploadMode);
  const activeIdRef = useRef(activeSpriteId);
  const previousSpriteIdRef = useRef(activeSpriteId);

  // Keep refs updated for use in callbacks
  useEffect(() => {
    isUploadModeRef.current = isUploadMode;
    activeIdRef.current = activeSpriteId;
  }, [isUploadMode, activeSpriteId]);

  // Trata Eventos do Blockly (Salvar)
  const handleBlocklyEvents = useCallback(
    (event: Blockly.Events.Abstract) => {
      if (!workspaceRef.current || isLoadingBlocks.current) return;
      if (event.isUiEvent) return;

      // 1. CASCATA DE DELEÇÃO PARA BLOCOS CUSTOMIZADOS (PROCEDURES)
      // Se um bloco de "Definição de Função" (custom_def_) for deletado,
      // devemos remover automaticamente todos os blocos de "Chamada" (custom_call_)
      // correspondentes no workspace para evitar erros de referência órfã.
      if (event.type === Blockly.Events.BLOCK_DELETE) {
        const blockDelete = event as Blockly.Events.BlockDelete;
        const deletedBlockJson = blockDelete.oldJson as { type?: string } | null;
        if (deletedBlockJson?.type?.startsWith('custom_def_')) {
          const procId = deletedBlockJson.type.replace('custom_def_', '');
          const callBlockType = 'custom_call_' + procId;
          const allBlocks = workspaceRef.current.getAllBlocks(false);
          allBlocks.forEach((block) => {
            if (block.type === callBlockType) block.dispose(false);
          });
        }
      }
      // 2. LÓGICA DE SALVAMENTO (Para qualquer mudança estrutural de blocos)
      if (
        event.type === Blockly.Events.BLOCK_CREATE ||
        event.type === Blockly.Events.BLOCK_CHANGE ||
        event.type === Blockly.Events.BLOCK_MOVE ||
        event.type === Blockly.Events.BLOCK_DELETE
      ) {
        const json = Blockly.serialization.workspaces.save(workspaceRef.current) as Record<string, unknown>;
        const blocksJson: IBlocklyWorkspaceJson = {
          blocks: (json.blocks as IBlocklyWorkspaceJson['blocks']) || { languageVersion: 0, blocks: [] },
          variables: json.variables as IBlocklyWorkspaceJson['variables'],
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
        }
      }

      // 3. SINCRONIZAÇÃO DE VARIÁVEIS (Mutations)
      if (event.type === Blockly.Events.VAR_DELETE) {
        const varDelete = event as Blockly.Events.VarDelete;
        const varName = varDelete.varName;
        if (varName) {
          const mode = isUploadModeRef.current ? 'upload' : 'stage';
          const targetVars = isUploadModeRef.current ? uploadVariables : stageVariables;
          if (targetVars.some((v) => v.name === varName)) {
            deleteVariable(mode, varName);
          }
        }
      }

      if (event.type === Blockly.Events.VAR_RENAME) {
        const varRename = event as Blockly.Events.VarRename;
        const oldName = varRename.oldName;
        const newName = varRename.newName;
        if (oldName && newName) {
          const targetVars = isUploadModeRef.current ? uploadVariables : stageVariables;
          if (targetVars.some((v) => v.name === oldName)) {
            const mode = isUploadModeRef.current ? 'upload' : 'stage';
            renameVariable(mode, oldName, newName);
          }
        }
      }
    },
    [workspaceRef, updateSpriteBlocks, setUploadModeBlocks, setUploadCode, stageVariables, uploadVariables, deleteVariable, renameVariable],
  );

  // Effect for non-destructive variable sync
  useEffect(() => {
    if (workspaceRef.current && !isLoadingBlocks.current) {
      const ws = workspaceRef.current as ExtendedWorkspace;
      const mode = isUploadMode ? 'upload' : 'stage';
      const targetVars = getUserVariables(mode);
      const varMap = ws.getVariableMap();

      targetVars.forEach((v) => {
        if (!varMap.getVariable(v.name)) {
          varMap.createVariable(v.name, v.type);
        }
      });

      const toolbox = ws.getToolbox ? ws.getToolbox() : null;
      if (toolbox) {
        toolbox.refreshSelection();
      }
    }
  }, [stageVariables, uploadVariables, isUploadMode, getUserVariables, workspaceRef]);

  // Effect for destructive block loading (switch sprite/mode)
  useEffect(() => {
    if (workspaceRef.current) {
      isLoadingBlocks.current = true;
      // Utilizamos um pequeno timeout (450ms) ao trocar de ator ou modo.
      // Isso garante que a transição visual do React termine e evita condições
      // de corrida onde o Blockly tenta carregar blocos em um container que
      // ainda está sendo redimensionado ou montado.
      const timeoutId = setTimeout(() => {
        const currentWs = workspaceRef.current as ExtendedWorkspace | null;
        if (!currentWs) return;

        const toolbox = isUploadMode ? ToolboxUploadDefinition : ToolboxDefinition;
        currentWs.updateToolbox(toolbox);
        setTimeout(applyCustomCategoryIcons, 0);

        // Se trocamos de ator, salvamos o estado do ator anterior antes de limpar o workspace.
        if (previousSpriteIdRef.current && previousSpriteIdRef.current !== activeSpriteId && !isUploadMode) {
          const json = Blockly.serialization.workspaces.save(currentWs) as Record<string, unknown>;
          const code = javascriptGenerator.workspaceToCode(currentWs);
          const blocksJson: IBlocklyWorkspaceJson = {
            blocks: (json.blocks as IBlocklyWorkspaceJson['blocks']) || { languageVersion: 0, blocks: [] },
            variables: json.variables as IBlocklyWorkspaceJson['variables'],
          };
          updateSpriteBlocks(previousSpriteIdRef.current, blocksJson, code);
        }

        try {
          previousSpriteIdRef.current = activeSpriteId;
          currentWs.clear();

          if (isUploadMode) {
            if (uploadModeBlocks) {
              const cleanJson = { ...uploadModeBlocks } as Record<string, unknown>;
              Blockly.serialization.workspaces.load(cleanJson as object, currentWs);
            } else {
              const setup = currentWs.newBlock('setup_block');
              setup.initSvg();
              setup.render();
              setup.moveBy(60, 40);
              setup.setDeletable(false);
              const loop = currentWs.newBlock('loop_block');
              loop.initSvg();
              loop.render();
              loop.moveBy(360, 40);
              loop.setDeletable(false);
            }
          } else {
            const spriteData = getSpriteById(activeIdRef.current);
            if (spriteData?.blocks) {
              const cleanJson = { ...spriteData.blocks } as Record<string, unknown>;
              Blockly.serialization.workspaces.load(cleanJson as object, currentWs);
            }
          }

          const toolbox = currentWs.getToolbox ? currentWs.getToolbox() : null;
          if (toolbox) {
            toolbox.refreshSelection();
          }
        } catch (e) {
          console.error('[useBlocklySync] Error switching mode:', e);
        } finally {
          Blockly.svgResize(currentWs);
          currentWs.render();
          isLoadingBlocks.current = false;
        }
      }, 450);

      return () => clearTimeout(timeoutId);
    }
  }, [isUploadMode, activeSpriteId, getSpriteById, updateSpriteBlocks, uploadModeBlocks, workspaceRef]);

  return {
    handleBlocklyEvents,
    isLoadingBlocks,
  };
}
