import * as Blockly from 'blockly/core';
import { MonitorData, ExtendedWorkspace } from '@/_base/domain/entities';

// Lista de blocos que podem ter monitores (Sincronizado com useBlocklyFlyout)
const MONITORABLE_BLOCKS = [
  'sensing_answer',
  'sensing_timer',
  'sensing_mousex',
  'sensing_mousey',
  'posicao_x',
  'posicao_y',
  'direcao',
  'variables_get',
];

export interface ContextMenuOptions {
  monitorsRef: React.RefObject<MonitorData[]>;
  setMonitorVisibility: (id: string, visible: boolean, data?: Partial<MonitorData>) => void;
  activeSpriteIdRef: React.RefObject<string>;
  activeSpriteNameRef: React.RefObject<string>;
}

/**
 * Configura patches de context menu no workspace.
 * Deve ser chamada APÓS Blockly.inject().
 */
export function setupContextMenu(options?: ContextMenuOptions): void {
  try {
    const registry = Blockly.ContextMenuRegistry.registry;
    const originalRegister = registry.register.bind(registry);

    // Override do método register para ignorar IDs indesejados
    registry.register = (item: Blockly.ContextMenuRegistry.RegistryItem) => {
      if (item.id === 'variableDelete' || item.id === 'variableRename') {
        return;
      }
      originalRegister(item);
    };

    // BLOQUEIO SEGURO VIA PROTOTYPE
    const blockSvgProto = Blockly.BlockSvg.prototype as unknown as {
      showContextMenu: (e: Event) => void;
      originalShowContextMenu?: (e: Event) => void;
    };
    if (blockSvgProto && !blockSvgProto.originalShowContextMenu) {
      blockSvgProto.originalShowContextMenu = blockSvgProto.showContextMenu;
      blockSvgProto.showContextMenu = function (this: Blockly.BlockSvg & { originalShowContextMenu: (e: Event) => void }, e: Event) {
        const workspace = this.workspace as ExtendedWorkspace;
        const isFlyout = !!(workspace && (workspace.isFlyout || (workspace.getParent && (workspace.getParent() as ExtendedWorkspace)?.isFlyout)));

        // Permitir menu no Flyout APENAS se o bloco for monitorável (para a nova lógica)
        if (isFlyout && !MONITORABLE_BLOCKS.includes(this.type)) {
          return;
        }
        return this.originalShowContextMenu.call(this, e);
      };
    }

    // Limpa apenas os que realmente precisam ser substituídos ou ocultos
    ['variableDelete', 'variableRename', 'blockDuplicate'].forEach((id) => {
      if (registry.getItem(id)) registry.unregister(id);
    });

    // --- OPÇÃO MONITORAR (MOSTRAR/ESCONDER) ---
    if (options) {
      const monitorToggleId = 'block_monitor_toggle';
      const monitorToggleOption: Blockly.ContextMenuRegistry.RegistryItem = {
        displayText: (scope: { block?: Blockly.BlockSvg }) => {
          if (!scope.block) return '';
          const { monitorId } = getMonitorMeta(scope.block, options);
          const isVisible = options.monitorsRef.current?.some((m) => m.id === monitorId && m.visible);
          return isVisible ? 'Esconder Monitor' : 'Mostrar Monitor';
        },
        preconditionFn: (scope: { block?: Blockly.BlockSvg }) => {
          return scope.block && MONITORABLE_BLOCKS.includes(scope.block.type) ? 'enabled' : 'hidden';
        },
        callback: (scope: { block?: Blockly.BlockSvg }) => {
          const block = scope.block;
          if (!block) return;

          const { monitorId, spriteId, label } = getMonitorMeta(block, options);
          const isVisible = options.monitorsRef.current?.some((m) => m.id === monitorId && m.visible);

          options.setMonitorVisibility(monitorId, !isVisible, {
            label,
            spriteId,
            type: block.type === 'variables_get' ? 'variable' : 'sensing',
            color: block.type === 'variables_get' ? '#FF8C1A' : '#5CB1D6',
          });
        },
        scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
        id: monitorToggleId,
        weight: -1, // No topo
      };

      if (registry.getItem(monitorToggleId)) registry.unregister(monitorToggleId);
      registry.register(monitorToggleOption);
    }

    // --- OPÇÃO DUPLICAR PILHA (SCRIPT INTEIRO) ---
    const duplicateStackId = 'duplicate_stack_option';
    const duplicateStackOption: Blockly.ContextMenuRegistry.RegistryItem = {
      displayText: 'Duplicar',
      preconditionFn: function (scope: { block?: Blockly.BlockSvg }) {
        const block = scope.block;
        if (!block) return 'hidden';
        if (block.type === 'setup_block' || block.type === 'loop_block') return 'disabled';
        return 'enabled';
      },
      callback: function (scope: { block?: Blockly.BlockSvg }) {
        const block = scope.block;
        if (!block) return;
        const json = Blockly.serialization.blocks.save(block);
        if (json) {
          const newBlock = Blockly.serialization.blocks.append(json, block.workspace, { recordUndo: true }) as Blockly.BlockSvg;
          const xy = block.getRelativeToSurfaceXY();
          newBlock.moveTo(new Blockly.utils.Coordinate(xy.x + 40, xy.y + 40));
          newBlock.initSvg();
          newBlock.render();
          newBlock.select();
        }
      },
      scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
      id: duplicateStackId,
      weight: 0,
    };

    if (registry.getItem(duplicateStackId)) registry.unregister(duplicateStackId);
    registry.register(duplicateStackOption);

    // --- PATCH: DELETAR (IGNORAR SOMBRAS) ---
    // O Blockly padrão conta blocos shadow como descendentes, o que faz com que
    // um bloco "set variable to [0]" mostre "Deletar 2 blocos".
    // Aqui filtramos para contar apenas blocos reais.
    const deleteOption = registry.getItem('blockDelete');
    if (deleteOption) {
      deleteOption.displayText = function () {
        return Blockly.Msg['DELETE_BLOCK'] || 'Deletar bloco';
      };
    }
  } catch (e) {
    console.warn('Falha ao aplicar patch no menu de contexto:', e);
  }
}

/**
 * Função utilitária para extrair metadados de monitor de um bloco (Sincronizado com useBlocklyFlyout)
 */
function getMonitorMeta(block: Blockly.Block, options: ContextMenuOptions) {
  const activeSpriteId = options.activeSpriteIdRef.current || 'stage';
  const isGlobalSensing = ['sensing_answer', 'sensing_timer', 'sensing_mousex', 'sensing_mousey'].includes(block.type);
  const spriteId = isGlobalSensing ? 'stage' : activeSpriteId;

  let monitorId = '';
  let label = '';
  let isGlobalVariable = false;

  if (block.type === 'variables_get') {
    const varId = block.getFieldValue('VAR');
    const variable = block.workspace.getVariableMap().getVariableById(varId) as unknown as { name: string; type: string } | null;
    label = variable ? variable.name : varId;
    isGlobalVariable = variable?.type === '';
    monitorId = `var_${varId}`;
  } else {
    monitorId = isGlobalSensing ? block.type : `${block.type}_${spriteId}`;
    if (block.type === 'sensing_answer') label = 'resposta';
    else if (block.type === 'sensing_timer') label = 'cronômetro';
    else if (block.type === 'sensing_mousex') label = 'x do mouse';
    else if (block.type === 'sensing_mousey') label = 'y do mouse';
    else if (block.type === 'posicao_x') label = 'posição x';
    else if (block.type === 'posicao_y') label = 'posição y';
    else if (block.type === 'direcao') label = 'direção';
  }

  const finalLabel = isGlobalSensing || isGlobalVariable ? label : `${options.activeSpriteNameRef.current}: ${label}`;
  return { monitorId, spriteId, label: finalLabel };
}

/**
 * Bloqueia context menu na Toolbox.
 */
export function createToolboxContextMenuBlocker(): (e: MouseEvent) => void {
  return (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    const isToolbox = Boolean(target.closest('.blocklyToolboxDiv') || target.closest('.blocklyFlyout') || target.closest('.blocklyToolboxCategory'));

    if (isToolbox) {
      // Permitir se o clique for em um bloco monitorável (o showContextMenu já filtra)
      // Mas o listener de mouse está bloqueando TUDO na toolbox. Precisamos liberar se for um bloco.
      if (target.closest('.blocklyDraggable')) return;

      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };
}
