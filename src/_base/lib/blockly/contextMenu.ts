import * as Blockly from 'blockly/core';

/**
 * Patches the Blockly Context Menu Registry to remove unwanted items
 * and add custom ones like "Duplicate Stack".
 */
export const patchBlocklyContextMenu = () => {
  try {
    const registry = Blockly.ContextMenuRegistry.registry;
    const originalRegister = registry.register.bind(registry);

    // Sobrescreve o método de registro para ignorar IDs indesejados
    // Ignora mudanças durante arr asto para performance, a menos que seja criação em arrasto.
    // Ocultar mudanças durante o 'drag' evita "jiggles" na interface de blocos.
    registry.register = (item: Blockly.ContextMenuRegistry.RegistryItem) => {
      if (item.id === 'variableDelete' || item.id === 'variableRename') {
        return;
      }
      originalRegister(item);
    };

    // Protege o bloco via prototype para interceptar o menu de contexto nos blocos
    const blockSvgProto = (
      Blockly as unknown as {
        BlockSvg: { prototype: Blockly.BlockSvg & { originalShowContextMenu: (e: Event) => void; showContextMenu: (e: Event) => void } };
      }
    ).BlockSvg?.prototype;
    if (blockSvgProto && !blockSvgProto.originalShowContextMenu) {
      blockSvgProto.originalShowContextMenu = blockSvgProto.showContextMenu;
      blockSvgProto.showContextMenu = function (this: Blockly.BlockSvg & { originalShowContextMenu: (e: Event) => void }, e: Event) {
        // Se o bloco está em um Flyout, ignora o menu
        const workspace = this.workspace as unknown as Blockly.WorkspaceSvg & { isFlyout?: boolean; getParentSvg?: () => SVGSVGElement | null };
        const parentSvg = workspace.getParentSvg ? workspace.getParentSvg() : null;
        if (workspace && (workspace.isFlyout || (parentSvg && (parentSvg as { isFlyout?: boolean }).isFlyout))) {
          return;
        }
        return this.originalShowContextMenu.call(this, e);
      };
    }

    // Limpa apenas os que realmente precisam ser substituídos ou ocultos
    const idsToRemove = ['variableDelete', 'variableRename', 'blockDuplicate'];

    idsToRemove.forEach((id) => {
      if (registry.getItem(id)) {
        registry.unregister(id);
      }
    });

    // O SEGREDO DOS ÍCONES CUSTOM:
    // O Blockly não suporta nativamente imagens de fundo arbitrárias em bolhas
    // de categoria via JSON. Para contornar isso, injetamos dinamicamente
    // regras CSS que miram o '[aria-label]' da categoria.
    // style.innerHTML = `
    //     [aria-label="${this.name}"] .categoryBubble,
    //     div.blocklyToolboxCategory[aria-label="${this.name}"] .categoryBubble {
    //       background-image: url('${this.iconUrl}') !important;
    //       background-size: ${this.iconScale}% !important;
    //       background-repeat: no-repeat !important;
    //       background-position: center !important;
    //       background-color: ${this.color} !important;
    //     }
    // `;

    registerDuplicateStackOption();
  } catch (e) {
    console.warn('Failed to apply context menu patch:', e);
  }
};

/**
 * Registers a custom "Duplicate" option that duplicates the entire stack
 * instead of just the single block.
 */
const registerDuplicateStackOption = () => {
  const registry = Blockly.ContextMenuRegistry.registry;
  const duplicateStackId = 'duplicate_stack_option';

  const duplicateStackOption: Blockly.ContextMenuRegistry.RegistryItem = {
    displayText: 'Duplicar',
    preconditionFn: function (scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block;
      if (!block) return 'hidden';

      // Previne duplicação de blocos raiz singleton
      if (block.type === 'setup_block' || block.type === 'loop_block') {
        return 'disabled';
      }

      return 'enabled';
    },
    callback: function (scope: Blockly.ContextMenuRegistry.Scope) {
      const block = scope.block as Blockly.BlockSvg;
      if (!block) return;

      // DUPLICAÇÃO VIA SERIALIZAÇÃO (Modern Blockly):
      // Em vez de percorrer a árvore de blocos manualmente, usamos o novo
      // sistema de serialização. Ele captura o bloco clicado e todos os
      // blocos conectados abaixo (stack), preservando IDs (se necessário)
      // ou gerando novos para evitar conflitos no workspace.
      const json = Blockly.serialization.blocks.save(block);

      if (json) {
        // Deserialize into the current workspace
        const newBlock = Blockly.serialization.blocks.append(json, block.workspace) as Blockly.BlockSvg;

        // Offset the new block
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

  if (registry.getItem(duplicateStackId)) {
    registry.unregister(duplicateStackId);
  }
  registry.register(duplicateStackOption);
};

/**
 * Global handler to prevent default browser context menu on Blockly's toolbox/flyout
 */
export const handleToolboxContextMenu = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const isToolbox =
    target &&
    (target.closest('.blocklyFlyout') ||
      target.closest('.blocklyToolboxDiv') ||
      target.closest('.blocklyToolbox') ||
      target.closest('.blocklyFlyoutScrollbar') ||
      target.closest('.blocklyFlyoutBackground') ||
      target.closest('.blocklyTreeRow') ||
      target.closest('.blocklyBlockCanvas'));

  if (isToolbox) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
};
