/**
 * Setup do Flyout do Blockly.
 *
 * Responsabilidades:
 * 1. Flyout click -> executa código do bloco no Stage mode
 * 2. Patch de scrollbar (ocultar/mostrar)
 * 3. Configuração de escala do flyout
 * 4. Injeção de checkboxes de monitoramento (Estilo Scratch)
 */

import { RefObject } from 'react';
import * as Blockly from 'blockly/core';
import { MonitorData, ExtendedWorkspace, ExtendedFlyout, ExtendedBlock } from '@/_base/domain/entities';

const MONITORABLE_BLOCKS = [
  'sensing_answer',
  'sensing_timer',
  'sensing_mousex',
  'sensing_mousey',
  'posicao_x',
  'posicao_y',
  'direcao',
  'variables_get',
  'looks_costumenumbername',
  'looks_backdropnumbername',
  'looks_size',
];

// Largura fixa do flyout — igual ao scratch-gui (FLYOUT_WIDTH = 250)
const FLYOUT_WIDTH = 250;

/**
 * Configura a escala e largura fixa do Flyout do workspace (estilo scratch-gui).
 * Intercepta getWidth() e reflowInternal_() para garantir largura constante.
 */
export function setupFlyoutScale(workspace: ExtendedWorkspace): void {
  if (!workspace || workspace.disposed) return;
  workspace.getFlyoutScale = () => 0.5;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flyout = (workspace.getFlyout() || workspace.getToolbox()?.getFlyout()) as (ExtendedFlyout & Record<string, any>) | null;
  if (!flyout) return;
  if (flyout.getFlyoutScale) flyout.getFlyoutScale = () => 0.5;

  // Fixa a largura do flyout independente do conteúdo (igual ao scratch-gui)
  flyout.getWidth = () => FLYOUT_WIDTH;

  // Impede que reflowInternal_ sobrescreva this.width_ com valor dinâmico
  const originalReflow = typeof flyout.reflowInternal_ === 'function' ? flyout.reflowInternal_.bind(flyout) : null;
  flyout.reflowInternal_ = function (this: typeof flyout) {
    if (originalReflow) originalReflow();
    this.width_ = FLYOUT_WIDTH;
  };
}

/**
 * Aplica patch de scrollbar no flyout (ocultar/mostrar elegantemente).
 */
export function patchFlyoutScrollbar(workspace: ExtendedWorkspace): void {
  if (!workspace || workspace.disposed) return;
  const flyout = (workspace.getFlyout() || workspace.getToolbox()?.getFlyout()) as ExtendedFlyout | null;
  if (flyout) {
    const originalSetVisible = flyout.setVisible;
    flyout.setVisible = function (visible: boolean) {
      if (workspace.disposed) return;
      if (originalSetVisible) originalSetVisible.call(this, visible);
      const domScrollbars = document.querySelectorAll('.blocklyFlyoutScrollbar');
      domScrollbars.forEach((el: Element) => {
        (el as HTMLElement).style.display = visible ? '' : 'none';
      });

      const self = this as ExtendedFlyout;
      if (self.scrollbar_ && self.scrollbar_.svgGroup_) {
        self.scrollbar_.svgGroup_.style.display = visible ? 'block' : 'none';
      }
    };
  }
}

/**
 * Sincroniza visualmente quais blocos na Toolbox estão com o monitor ativo no Palco.
 * Aplica a classe 'blockly-monitor-active' se o ID do monitor estiver na lista de monitores.
 */
export function syncFlyoutHighlights(
  workspace: Blockly.WorkspaceSvg,
  monitorsRef: RefObject<MonitorData[]>,
  activeSpriteIdRef: RefObject<string>,
  activeSpriteNameRef: RefObject<string>,
): void {
  if (!workspace || (workspace as ExtendedWorkspace).disposed) return;
  const flyout = (workspace.getFlyout() || (workspace as ExtendedWorkspace).getToolbox()?.getFlyout()) as ExtendedFlyout | null;
  const flyoutWs = flyout ? flyout.getWorkspace() : null;
  if (!flyoutWs) return;

  const blocks = flyoutWs.getTopBlocks(false);
  const monitors = monitorsRef.current || [];

  blocks.forEach((block: Blockly.Block) => {
    if (!MONITORABLE_BLOCKS.includes(block.type) || block.isShadow() || block.getParent()) return;

    const { monitorId } = getMonitorMeta(block, activeSpriteIdRef, activeSpriteNameRef);
    const isVisible = monitors.some((m) => m.id === monitorId && m.visible);
    const svgRoot = (block as ExtendedBlock).getSvgRoot();

    if (svgRoot) {
      if (isVisible) {
        svgRoot.classList.add('blockly-monitor-active');
      } else {
        svgRoot.classList.remove('blockly-monitor-active');
      }
    }
  });
}

// Persistência interna para detecção de clique duplo sem re-render (Clean UI)
let lastClickTime = 0;
let lastBlockId = '';

// Guard contra execução acidental durante drag.
// Blockly dispara CLICK no mousedown (antes de saber se é drag).
// Se um BLOCK_DRAG vier logo depois, cancelamos a execução pendente.
let pendingWorkspaceClick: { blockId: string; timer: ReturnType<typeof setTimeout> } | null = null;

function cancelPendingWorkspaceClick() {
  if (pendingWorkspaceClick) {
    clearTimeout(pendingWorkspaceClick.timer);
    pendingWorkspaceClick = null;
  }
}

/**
 * Cria o handler de click no Flyout para executar blocos (Stage Mode) e alternar monitores (Double Click).
 */
export function createFlyoutClickHandler(
  workspace: Blockly.WorkspaceSvg,
  isUploadModeRef: RefObject<boolean>,
  onRunCodeRef: RefObject<((blockId: string, workspaceId: string) => void) | undefined>,
  onBlockClickRef: RefObject<((code: string) => void) | undefined>,
  monitorsRef?: RefObject<MonitorData[]>,
  setMonitorVisibility?: (id: string, visible: boolean, data?: Partial<MonitorData>) => void,
  activeSpriteIdRef?: RefObject<string>,
  activeSpriteNameRef?: RefObject<string>,
): (event: Blockly.Events.Abstract) => void {
  return (event: Blockly.Events.Abstract) => {
    if ((workspace as ExtendedWorkspace).disposed) return;

    // Se um drag começar, cancela qualquer clique de workspace pendente.
    // Isso evita execução acidental ao arrastar blocos (CLICK dispara antes do drag).
    if (event.type === Blockly.Events.BLOCK_DRAG) {
      const dragEvent = event as Blockly.Events.BlockDrag;
      if (dragEvent.isStart) cancelPendingWorkspaceClick();
      return;
    }

    if (event.type === Blockly.Events.CLICK) {
      const clickEvent = event as Blockly.Events.Click;
      const blockId = clickEvent.blockId;
      if (!blockId) return;

      if (!isUploadModeRef.current && workspace) {
        const flyout = (workspace.getFlyout() || (workspace as ExtendedWorkspace).getToolbox()?.getFlyout()) as ExtendedFlyout | null;
        const flyoutWs = flyout ? flyout.getWorkspace() : null;

        // --- CLIQUE NO FLYOUT (Toolbox) ---
        if (flyoutWs && event.workspaceId === flyoutWs.id) {
          const block = flyoutWs.getBlockById(blockId);
          if (!block || !block.isEnabled()) return;

          // --- DETECÇÃO DE CLIQUE DUPLO (Toggle Monitor) ---
          const now = Date.now();
          const isDoubleClick = blockId === lastBlockId && now - lastClickTime < 350;
          lastClickTime = now;
          lastBlockId = blockId;

          if (
            isDoubleClick &&
            MONITORABLE_BLOCKS.includes(block.type) &&
            setMonitorVisibility &&
            monitorsRef &&
            activeSpriteIdRef &&
            activeSpriteNameRef
          ) {
            const { monitorId, spriteId, label } = getMonitorMeta(block, activeSpriteIdRef, activeSpriteNameRef);
            const isVisible = monitorsRef.current?.some((m) => m.id === monitorId && m.visible);

            setMonitorVisibility(monitorId, !isVisible, {
              label,
              spriteId,
              type: block.type === 'variables_get' ? 'variable' : 'sensing',
              color: block.type === 'variables_get' ? '#FF8C1A' : '#5CB1D6',
            });

            // Feedback visual imediato
            const svgRoot = (block as ExtendedBlock).getSvgRoot();
            if (svgRoot) {
              if (!isVisible) svgRoot.classList.add('blockly-monitor-active');
              else svgRoot.classList.remove('blockly-monitor-active');
            }
            return;
          }

          // --- CLIQUE SIMPLES NO FLYOUT (Executar Código via VM) ---
          if (onRunCodeRef.current) {
            onRunCodeRef.current(blockId, flyoutWs.id);
          }
        }

        // --- CLIQUE NO WORKSPACE PRINCIPAL ---
        // Adia em 1 frame para que um eventual BLOCK_DRAG possa cancelar.
        if (workspace && event.workspaceId === workspace.id) {
          cancelPendingWorkspaceClick();
          pendingWorkspaceClick = {
            blockId,
            timer: setTimeout(() => {
              pendingWorkspaceClick = null;
              if (onBlockClickRef.current) onBlockClickRef.current(blockId);
            }, 50),
          };
        }
      }
    }
  };
}

/**
 * Registra listeners no workspace e flyout.
 */
export function setupFlyoutListeners(
  workspace: Blockly.WorkspaceSvg,
  handleBlocklyEventsRef: RefObject<(event: Blockly.Events.Abstract) => void>,
  isUploadModeRef: RefObject<boolean>,
  onRunCodeRef: RefObject<((blockId: string, workspaceId: string) => void) | undefined>,
  onBlockClickRef: RefObject<((code: string) => void) | undefined>,
  monitorsRef?: RefObject<MonitorData[]>,
  setMonitorVisibility?: (id: string, visible: boolean, data?: Partial<MonitorData>) => void,
  activeSpriteIdRef?: RefObject<string>,
  activeSpriteNameRef?: RefObject<string>,
): void {
  if (!workspace || (workspace as ExtendedWorkspace).disposed) return;
  const handleFlyoutClick = createFlyoutClickHandler(
    workspace,
    isUploadModeRef,
    onRunCodeRef,
    onBlockClickRef,
    monitorsRef,
    setMonitorVisibility,
    activeSpriteIdRef,
    activeSpriteNameRef,
  );

  const mainListener = (event: Blockly.Events.Abstract) => {
    if ((workspace as ExtendedWorkspace).disposed) return;
    if (handleBlocklyEventsRef.current) handleBlocklyEventsRef.current(event);
    handleFlyoutClick(event);
  };
  workspace.addChangeListener(mainListener);
  const flyout = (workspace.getFlyout() || (workspace as ExtendedWorkspace).getToolbox()?.getFlyout()) as ExtendedFlyout | null;
  if (flyout && flyout.getWorkspace()) (flyout.getWorkspace() as ExtendedWorkspace).addChangeListener(mainListener);
}

/**
 * Função utilitária para extrair metadados de monitor de um bloco.
 */
function getMonitorMeta(block: Blockly.Block, activeSpriteIdRef: RefObject<string>, activeSpriteNameRef: RefObject<string>) {
  const activeSpriteId = activeSpriteIdRef.current || 'stage';
  const isGlobalSensing = ['sensing_answer', 'sensing_timer', 'sensing_mousex', 'sensing_mousey'].includes(block.type);
  const spriteId = isGlobalSensing ? 'stage' : activeSpriteId;
  const monitorId =
    block.type === 'variables_get'
      ? `var_${block.getFieldValue('VAR')}`
      : isGlobalSensing
        ? block.type
        : `${block.type}_${spriteId}_${block.getFieldValue('NUMBER_NAME') || ''}`;

  let label = block.type;
  let isGlobalVariable = false;

  if (block.type === 'variables_get') {
    const varId = block.getFieldValue('VAR');
    const variable = block.workspace.getVariableMap().getVariableById(varId) as unknown as { name: string; type: string } | null;
    label = variable ? variable.name : varId;
    isGlobalVariable = variable?.type === '';
  } else if (block.type === 'sensing_answer') label = 'resposta';
  else if (block.type === 'sensing_timer') label = 'cronômetro';
  else if (block.type === 'sensing_mousex') label = 'x do mouse';
  else if (block.type === 'sensing_mousey') label = 'y do mouse';
  else if (block.type === 'posicao_x') label = 'posição x';
  else if (block.type === 'posicao_y') label = 'posição y';
  else if (block.type === 'direcao') label = 'direção';
  else if (block.type === 'looks_costumenumbername') {
    const type = block.getFieldValue('NUMBER_NAME');
    label = `fantasia ${type === 'number' ? 'número' : 'nome'}`;
  } else if (block.type === 'looks_backdropnumbername') {
    const type = block.getFieldValue('NUMBER_NAME');
    label = `cenário ${type === 'number' ? 'número' : 'nome'}`;
  } else if (block.type === 'looks_size') label = 'tamanho';

  const finalLabel = isGlobalSensing || isGlobalVariable ? label : `${activeSpriteNameRef.current}: ${label}`;
  return { monitorId, spriteId, label: finalLabel };
}
