/**
 * Setup do Listener de Variáveis Tipadas no Blockly.
 *
 * Responsabilidades:
 * 1. Aplica lógica de tipagem forte (applyVariableTypeLogic) nos blocos de variáveis
 * 2. Listener para VAR_CHANGE, VAR_RENAME, VAR_DELETE e BLOCK_CREATE
 */

/**
 * Sincronização de nomes e IDs de variáveis entre o Blockly e o estado do sistema.
 */
import * as Blockly from 'blockly/core';
import { applyVariableTypeLogic } from '../../../config/custom_definitions';

const BLOCKS_WITH_VARIABLE_TYPE = ['variables_set', 'variables_get', 'math_change'];

/**
 * Registra o listener de variáveis tipadas no workspace.
 * Deve ser chamada APÓS Blockly.inject().
 */
export function setupVariableTypeListeners(workspace: Blockly.WorkspaceSvg): void {
  workspace.addChangeListener((event: Blockly.Events.Abstract) => {
    if (!workspace) return;

    // Ignorar mudanças de valor/campo DURANTE o arrasto para performance,
    // mas permitir CRIAÇÃO (pois arrastar do flyout é uma criação durante o drag)
    if (workspace.isDragging() && event.type !== Blockly.Events.BLOCK_CREATE) return;

    // 1. Mudança direta no campo VAR (ex: Dropdown)
    if (event.type === Blockly.Events.BLOCK_CHANGE) {
      const changeEvent = event as Blockly.Events.BlockChange;
      if (changeEvent.element === 'field' && changeEvent.name === 'VAR') {
        const block = workspace.getBlockById(changeEvent.blockId || '');
        if (block) {
          applyVariableTypeLogic(block, true);
        }
      }
    }

    // 2. Renomeação ou Deleção de Variável -> Atualiza TODOS os blocos
    if (event.type === Blockly.Events.VAR_RENAME || event.type === Blockly.Events.VAR_DELETE) {
      const allBlocks = workspace.getAllBlocks(false) || [];
      allBlocks.forEach((b) => {
        if (BLOCKS_WITH_VARIABLE_TYPE.includes(b.type)) {
          applyVariableTypeLogic(b, true);
        }
      });
    }

    // 3. Criação de Bloco (Arrastado do Flyout ou Duplicado)
    if (event.type === Blockly.Events.BLOCK_CREATE) {
      const createEvent = event as Blockly.Events.BlockCreate;
      if (createEvent.ids) {
        createEvent.ids.forEach((blockId: string) => {
          const block = workspace.getBlockById(blockId);
          if (block && BLOCKS_WITH_VARIABLE_TYPE.includes(block.type)) {
            applyVariableTypeLogic(block, true);
          }
        });
      }
    }
  });
}
