/**
 * Hook: useBlocklyInit
 *
 * Responsabilidade principal: Inicializar o workspace Blockly.
 * Orquestra todos os módulos de setup (context menu, toolbox callbacks, variable sync, flyout).
 *
 * Retorna workspaceRef para ser usado pelos demais hooks e componentes.
 */

import { useEffect, useRef, useCallback, RefObject } from 'react';
import * as React from 'react';
/**
 * Configuração e inicialização do workspace do Blockly (temas, plugins, lógicas core).
 */
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import '@blockly/field-slider';
import { FieldColourHsvSliders } from '@blockly/field-colour-hsv-sliders';

// --- CUSTOM COLOUR PICKER SIZE OVERRIDE (Scratch 3.0 Like) ---
// Override width and height of the HSV colour slider directly on the prototype
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalUpdateSize = (FieldColourHsvSliders.prototype as any).updateSize_;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(FieldColourHsvSliders.prototype as any).updateSize_ = function (margin?: number) {
  if (originalUpdateSize) {
    originalUpdateSize.call(this, margin);
  }
  if (!this.isFullBlockField()) {
    this.size_.width = 40; // 40px wide like Scratch
    this.size_.height = 26; // 26px high
    if (this.positionBorderRect_) {
      this.positionBorderRect_();
    }
    const borderRect = this.getBorderRect();
    if (borderRect) {
      borderRect.setAttribute('rx', '10'); // Borda levemente arredondada (4px)
      borderRect.setAttribute('ry', '10');
    }
  }
};

import { ToolboxDefinition, ToolboxUploadDefinition } from '../../../config/toolbox';
import { initStageGenerators } from '../../../generators/stage';
import { initCustomGenerators } from '../../../generators/custom_generators';
import { injectAllCategoryIcons } from '../../../lib/blockly/BlockBuilder';
import { getMachineLearningCategory } from '../../../config/toolbox/common/ml';
import { getBoardCategory } from '../../../config/toolbox/stage/board_stage';
import { BlockStageDefinitions, BlockBoardDefinitions, registerCustomExtensions, CustomBlockDefinitions } from '../../../config/custom_definitions';
import { catArtbot } from '../../../config/toolbox/board/artbot';
// import { catEventsBoard } from '../../../config/toolbox/board/events';
import { registerContinuousToolbox } from '@blockly/continuous-toolbox';

// Custom fields remoted by user
import { setupBlocklyLocale } from '../../../config/blockly/locale';
import { getWorkspaceOptions } from '../../../config/blockly/workspace-options';
import { setupContextMenu } from './useBlocklyContextMenu';
import { registerToolboxCallbacks, ToolboxCallbackHandlers } from './useBlocklyToolboxCallbacks';
import { setupVariableTypeListeners } from './useBlocklyVariableSync';
import { setupFlyoutScale, setupFlyoutListeners, patchFlyoutScrollbar } from './useBlocklyFlyout';
import { registerBlocklyCategories, createCategoryIconObserver, applyCustomCategoryIcons } from '../../../lib/blockly/categories';
import { MonitorData } from '@/_base/domain/entities';
import { getStageToolbox, getUploadToolbox } from '@/_base/config/toolbox/index';

function registerForceHat(this: Blockly.Block & { hat?: string }) {
  this.hat = 'cap';
}

// CustomContinuousCategory removido daqui e movido para app/lib/blockly/categories.ts

export interface UseBlocklyInitParams {
  blocklyDiv: RefObject<HTMLDivElement | null>;
  isUploadMode: boolean;
  activeExtensions: string[];
  // Modal state setters
  setIsVarModalOpen: (open: boolean) => void;
  setIsVarDeleteModalOpen: (open: boolean) => void;
  setIsListModalOpen: (open: boolean) => void;
  setIsListDeleteModalOpen: (open: boolean) => void;
  setIsProcModalOpen: (open: boolean) => void;
  setIsBroadcastModalOpen: (open: boolean) => void;
  setIsExtensionModalOpen: (open: boolean) => void;
  setIsMLModalOpen: (open: boolean) => void;
  // Refs for event handling
  handleBlocklyEventsRef: RefObject<(event: Blockly.Events.Abstract) => void>;
  isUploadModeRef: RefObject<boolean>;
  activeSpriteIdRef: RefObject<string>;
  activeSpriteNameRef: RefObject<string>;
  onRunCodeRef: RefObject<((blockId: string, workspaceId: string) => void) | undefined>;
  onBlockClickRef: RefObject<((code: string) => void) | undefined>;
  // Monitor related
  monitorsRef: RefObject<MonitorData[]>;
  setMonitorVisibility: (id: string, visible: boolean, data?: Partial<MonitorData>) => void;
}

export function useBlocklyInit(params: UseBlocklyInitParams): {
  workspaceRef: RefObject<Blockly.WorkspaceSvg | null>;
  workspace: Blockly.WorkspaceSvg | null;
} {
  const {
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
    activeSpriteIdRef,
    activeSpriteNameRef,
    onRunCodeRef,
    onBlockClickRef,
    monitorsRef,
    setMonitorVisibility,
  } = params;

  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [workspace, setWorkspace] = React.useState<Blockly.WorkspaceSvg | null>(null);

  // --- EVENT HANDLERS ---
  const handleToolboxContextMenu = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const category = target.closest('.blocklyToolboxCategory');
    if (category) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  useEffect(() => {
    if (!blocklyDiv.current) return;

    if (!workspaceRef.current) {
      setupBlocklyLocale();
      if (!Blockly.Extensions.isRegistered('force_hat')) {
        Blockly.Extensions.register('force_hat', registerForceHat);
      }
      registerCustomExtensions();

      Blockly.defineBlocksWithJsonArray(BlockStageDefinitions);
      Blockly.defineBlocksWithJsonArray(BlockBoardDefinitions);
      Blockly.defineBlocksWithJsonArray(CustomBlockDefinitions);

      Blockly.defineBlocksWithJsonArray([
        {
          type: 'variables_get',
          message0: '%1',
          args0: [
            {
              type: 'field_variable',
              name: 'VAR',
              variable: '',
              variableTypes: ['Number', 'String'],
              defaultType: 'Number',
            },
          ],
          output: null,
          style: 'variable_blocks',
        },
        {
          type: 'variables_set',
          message0: 'definir %1 como %2',
          args0: [
            {
              type: 'field_variable',
              name: 'VAR',
              variable: '',
              variableTypes: ['Number', 'String'],
              defaultType: 'Number',
            },
            { type: 'input_value', name: 'VALUE' },
          ],
          previousStatement: null,
          nextStatement: null,
          style: 'variable_blocks',
        },
        {
          type: 'math_change',
          message0: 'mudar %1 por %2',
          args0: [
            {
              type: 'field_variable',
              name: 'VAR',
              variable: '',
              variableTypes: ['Number'],
              defaultType: 'Number',
            },
            { type: 'input_value', name: 'DELTA', check: 'Number' },
          ],
          previousStatement: null,
          nextStatement: null,
          style: 'variable_blocks',
          extensions: ['math_change_tooltip'],
        },
        {
          type: 'data_showvariable',
          message0: 'mostrar variável %1',
          args0: [
            {
              type: 'field_variable',
              name: 'VAR',
              variable: '',
              variableTypes: ['Number', 'String'],
              defaultType: 'Number',
            },
          ],
          previousStatement: null,
          nextStatement: null,
          style: 'variable_blocks',
        },
        {
          type: 'data_hidevariable',
          message0: 'esconder variável %1',
          args0: [
            {
              type: 'field_variable',
              name: 'VAR',
              variable: '',
              variableTypes: ['Number', 'String'],
              defaultType: 'Number',
            },
          ],
          previousStatement: null,
          nextStatement: null,
          style: 'variable_blocks',
        },
        {
          type: 'math_arithmetic',
          message0: '%1 %2 %3',
          args0: [
            { type: 'input_value', name: 'A', check: null },
            {
              type: 'field_dropdown',
              name: 'OP',
              options: [
                ['%{BKY_MATH_ADDITION_SYMBOL}', 'ADD'],
                ['%{BKY_MATH_SUBTRACTION_SYMBOL}', 'MINUS'],
                ['%{BKY_MATH_MULTIPLICATION_SYMBOL}', 'MULTIPLY'],
                ['%{BKY_MATH_DIVISION_SYMBOL}', 'DIVIDE'],
                ['%{BKY_MATH_POWER_SYMBOL}', 'POWER'],
              ],
            },
            { type: 'input_value', name: 'B', check: null },
          ],
          inputsInline: true,
          output: 'Number',
          style: 'math_blocks',
          tooltip: '%{BKY_MATH_ARITHMETIC_TOOLTIP}',
          helpUrl: '%{BKY_MATH_ARITHMETIC_HELPURL}',
        },
        {
          type: 'logic_compare',
          message0: '%1 %2 %3',
          args0: [
            { type: 'input_value', name: 'A', check: null },
            {
              type: 'field_dropdown',
              name: 'OP',
              options: [
                ['=', 'EQ'],
                ['\u2260', 'NEQ'],
                ['\u2039', 'LT'],
                ['\u2264', 'LTE'],
                ['\u203A', 'GT'],
                ['\u2265', 'GTE'],
              ],
            },
            { type: 'input_value', name: 'B', check: null },
          ],
          inputsInline: true,
          output: 'Boolean',
          style: 'logic_blocks',
          tooltip: '%{BKY_LOGIC_COMPARE_TOOLTIP}',
          helpUrl: '%{BKY_LOGIC_COMPARE_HELPURL}',
        },
      ]);

      setupContextMenu({
        monitorsRef,
        setMonitorVisibility,
        activeSpriteIdRef,
        activeSpriteNameRef,
      });
      blocklyDiv.current?.addEventListener('contextmenu', handleToolboxContextMenu, true);
      document.addEventListener('contextmenu', handleToolboxContextMenu, true);

      // --- GLOBAL MODAL TRIGGERS ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).openBroadcastModal = (field: Blockly.FieldDropdown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).pendingBroadcastField = field;
        setIsBroadcastModalOpen(true);
      };

      initStageGenerators();
      initCustomGenerators();
      try {
        registerContinuousToolbox();
        // O registro da categoria customizada DEVE vir após o registerContinuousToolbox
        // para garantir que não seja sobrescrito pelo plugin.
        registerBlocklyCategories();
      } catch (_e) {
        // Já registrado ou CSS já injetado (HMR)
      }

      injectAllCategoryIcons([getMachineLearningCategory(false), getBoardCategory(), catArtbot]);

      workspaceRef.current = Blockly.inject(blocklyDiv.current, getWorkspaceOptions());
      setWorkspace(workspaceRef.current);

      // Define o container do workspace como bounds do DropDownDiv.
      // Sem isso, o Blockly calcula espaço disponível relativo à janela inteira
      // e abre dropdowns para cima quando o bloco está na parte inferior do flyout.
      Blockly.DropDownDiv.setBoundsElement(blocklyDiv.current);

      // Ativa o observer para garantir que os ícones das categorias sejam injetados/mantidos no DOM
      createCategoryIconObserver(blocklyDiv.current);

      const injectExtensionButton = () => {
        const toolboxDiv = document.querySelector('.blocklyToolboxDiv') as HTMLElement;
        if (toolboxDiv) {
          // Ocultar scrollbar webkit (pseudo-elementos exigem <style>, não podem ser feitos via JS)
          const styleId = 'blockly-toolbox-styles';
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `.blocklyToolboxDiv::-webkit-scrollbar { display: none; }`;
            document.head.appendChild(style);
          }

          // Flyout z-index — Blockly injeta inline; sobrescrevemos após a mutação
          const flyout = document.querySelector('.blocklyFlyout') as HTMLElement | null;
          if (flyout) flyout.style.zIndex = '40';
        }
      };

      const toolboxObserver = new MutationObserver(injectExtensionButton);
      toolboxObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style'],
      });

      // Tentativas iniciais
      injectExtensionButton();
      [10, 50, 100, 300, 500, 1000].forEach((delay) => setTimeout(injectExtensionButton, delay));

      if (workspaceRef.current) {
        setupVariableTypeListeners(workspaceRef.current);
        const toolboxHandlers: ToolboxCallbackHandlers = {
          setIsVarModalOpen,
          setIsVarDeleteModalOpen,
          setIsListModalOpen,
          setIsListDeleteModalOpen,
          setIsProcModalOpen,
          setIsMLModalOpen,
          isUploadModeRef,
          activeSpriteIdRef,
        };
        registerToolboxCallbacks(workspaceRef.current, toolboxHandlers);
        const initialToolbox = isUploadMode ? ToolboxUploadDefinition : ToolboxDefinition;
        workspaceRef.current.updateToolbox(initialToolbox);
        Blockly.svgResize(workspaceRef.current);
        setupFlyoutScale(workspaceRef.current);
        if (workspaceRef.current.getToolbox()) {
          (workspaceRef.current.getToolbox() as Blockly.IToolbox).refreshSelection();
        }

        const refreshToolbox = () => {
          if (!workspaceRef.current || (workspaceRef.current as any).disposed) return;
          
          Blockly.Events.disable();
          try {
            const isStageSelected = activeSpriteIdRef.current === 'stage';
            workspaceRef.current.updateToolbox(isUploadMode ? getUploadToolbox(activeExtensions) : getStageToolbox(activeExtensions, isStageSelected));
            Blockly.svgResize(workspaceRef.current);

            const toolbox = workspaceRef.current.getToolbox();
            if (toolbox) {
              (toolbox as Blockly.IToolbox).refreshSelection();
            }
            // Chama com 0ms para garantir que o stack de refreshSelection terminou
            setTimeout(applyCustomCategoryIcons, 0);
          } finally {
            Blockly.Events.enable();
          }
        };
        refreshToolbox();

        setupFlyoutScale(workspaceRef.current);

        setupFlyoutListeners(
          workspaceRef.current,
          handleBlocklyEventsRef,
          isUploadModeRef,
          onRunCodeRef,
          onBlockClickRef,
          monitorsRef,
          setMonitorVisibility,
          activeSpriteIdRef,
          activeSpriteNameRef,
        );
        patchFlyoutScrollbar(workspaceRef.current);
      }

      const resizeObserver = new ResizeObserver(() => {
        if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
      });
      resizeObserver.observe(blocklyDiv.current);

      const div = blocklyDiv.current;
      return () => {
        resizeObserver.disconnect();
        toolboxObserver.disconnect();
        if (workspaceRef.current) {
          try {
            Blockly.Events.disable(); // Evita que recycler dispare eventos durante disposal
            const ws = workspaceRef.current;
            (ws as any).dispose();
          } catch (e) {
            console.warn('[useBlocklyInit] Error during workspace disposal:', e);
          } finally {
            Blockly.Events.enable();
            workspaceRef.current = null;
            setWorkspace(null);
          }
        }
        if (div) {
          div.removeEventListener('contextmenu', handleToolboxContextMenu, true);
        }
        document.removeEventListener('contextmenu', handleToolboxContextMenu, true);
        workspaceRef.current = null;
      };
    }
  }, [
    handleToolboxContextMenu,
    blocklyDiv,
    handleBlocklyEventsRef,
    isUploadModeRef,
    onRunCodeRef,
    onBlockClickRef,
    setIsVarModalOpen,
    setIsVarDeleteModalOpen,
    setIsListModalOpen,
    setIsListDeleteModalOpen,
    setIsProcModalOpen,
    setIsBroadcastModalOpen,
    setIsExtensionModalOpen,
    setIsMLModalOpen,
    activeExtensions,
    isUploadMode,
    activeSpriteIdRef,
    activeSpriteNameRef,
    monitorsRef,
    setMonitorVisibility,
  ]);

  return { workspaceRef, workspace };
}
