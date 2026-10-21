import * as Blockly from 'blockly/core';

/**
 * Creates and returns the XML list for the custom procedures (My Blocks) category in the toolbox.
 */
export const createProcedureCategoryXml = (ws: Blockly.WorkspaceSvg) => {
  const xmlList: Element[] = [];

  // Botão Criar Bloco
  const btnCreate = document.createElement('button');
  btnCreate.setAttribute('text', 'Criar um Bloco');
  btnCreate.setAttribute('callbackKey', 'CREATE_MY_BLOCK_BTN');
  xmlList.push(btnCreate);

  // Lista todas as definições de procedimentos existentes como blocos chamáveis
  const blocks = ws.getAllBlocks(false);
  for (const block of blocks) {
    if (block.type.startsWith('custom_def_')) {
      const indexSuffix = block.type.replace('custom_def_', '');
      const callType = 'custom_call_' + indexSuffix;
      const blockXml = document.createElement('block');
      blockXml.setAttribute('type', callType);
      blockXml.setAttribute('gap', '16');

      const prototype = block.getInputTargetBlock('PROTOTYPE');
      if (prototype) {
        prototype.inputList.forEach((input) => {
          if (input.name.startsWith('ARG_')) {
            const argBlock = input.connection?.targetBlock();
            if (argBlock) {
              const valueElem = document.createElement('value');
              valueElem.setAttribute('name', input.name);
              if (argBlock.type === 'argument_reporter_string') {
                const shadowElem = document.createElement('shadow');
                shadowElem.setAttribute('type', 'text');
                const field = document.createElement('field');
                field.setAttribute('name', 'TEXT');
                field.textContent = '';
                shadowElem.appendChild(field);
                valueElem.appendChild(shadowElem);
              } else if (argBlock.type === 'argument_reporter_number') {
                const shadowElem = document.createElement('shadow');
                shadowElem.setAttribute('type', 'math_number');
                const field = document.createElement('field');
                field.setAttribute('name', 'NUM');
                field.textContent = '0';
                shadowElem.appendChild(field);
                valueElem.appendChild(shadowElem);
              }
              blockXml.appendChild(valueElem);
            }
          }
        });
      }
      xmlList.push(blockXml);
    }
  }
  return xmlList;
};
