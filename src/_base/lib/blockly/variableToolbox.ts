import * as Blockly from 'blockly/core';
import { applyVariableTypeLogic } from '../../config/custom_definitions';
import { getProjectService } from '@/_base/services/code';

/**
 * Logic for updating variable type shadows dynamically when a variable is changed.
 */
export const registerVariableTypeChangeListener = (workspace: Blockly.WorkspaceSvg) => {
  const blocksToInjectListener = ['variables_set', 'variables_get', 'math_change'];

  workspace.addChangeListener((event: Blockly.Events.Abstract) => {
    if (!workspace) return;

    // Ignora mudanças durante arrasto para performance, a menos que seja criação em arrasto
    if (workspace.isDragging() && event.type !== Blockly.Events.BLOCK_CREATE) return;

    // 1. Mudança direta no dropdown de variável
    if (event.type === Blockly.Events.BLOCK_CHANGE) {
      const changeEvent = event as Blockly.Events.BlockChange;
      if (changeEvent.element === 'field' && changeEvent.name === 'VAR') {
        const block = workspace.getBlockById(changeEvent.blockId || '');
        if (block) {
          applyVariableTypeLogic(block, true);
        }
      }
    }

    // 2. Variable Rename or Delete -> Update ALL blocks
    if (event.type === Blockly.Events.VAR_RENAME || event.type === Blockly.Events.VAR_DELETE) {
      const allBlocks = workspace.getAllBlocks(false) || [];
      allBlocks.forEach((b) => {
        if (blocksToInjectListener.includes(b.type)) {
          applyVariableTypeLogic(b, true);
        }
      });
    }

    // 3. Block creation (drag from flyout or duplicate)
    if (event.type === Blockly.Events.BLOCK_CREATE) {
      const createEvent = event as Blockly.Events.BlockCreate;
      if (createEvent.ids) {
        createEvent.ids.forEach((blockId: string) => {
          const block = workspace.getBlockById(blockId);
          if (block && blocksToInjectListener.includes(block.type)) {
            applyVariableTypeLogic(block, true);
          }
        });
      }
    }
  });
};

/**
 * Creates and returns the XML list for the custom variable category in the toolbox.
 */
export const createVariableCategoryXml = (ws: Blockly.WorkspaceSvg, isUploadMode: boolean) => {
  const mode = isUploadMode ? 'upload' : 'stage';
  const currentVars = getProjectService().getUserVariables(mode);

  const xmlList: Element[] = [];

  // Botão Criar
  const btnCreate = document.createElement('button');
  btnCreate.setAttribute('text', 'Criar Variável');
  btnCreate.setAttribute('callbackKey', 'OPEN_VARIABLE_MODAL');
  xmlList.push(btnCreate);

  // Botão Deletar (apenas se existirem variáveis)
  if (currentVars.length > 0) {
    const btnDelete = document.createElement('button');
    btnDelete.setAttribute('text', 'Apagar Variável');
    btnDelete.setAttribute('callbackKey', 'OPEN_VARIABLE_DELETE_MODAL');
    xmlList.push(btnDelete);
  }

  // Sincroniza variáveis do ProjectService para o mapa do workspace
  currentVars.forEach((v) => {
    if (!ws.getVariableMap().getVariable(v.name, v.type)) {
      ws.getVariableMap().createVariable(v.name, v.type, v.id);
    }
  });

  // Usa a lista do ProjectService como fonte de verdade
  const allVars = currentVars
    .map((cv) => {
      const wsVar = ws.getVariableMap().getVariable(cv.name, cv.type);
      return wsVar ? wsVar : null;
    })
    .filter((v): v is Blockly.VariableModel => v !== null);

  if (allVars.length > 0) {
    const lastVar = allVars[allVars.length - 1];
    const lastVarId = lastVar.getId();
    const lastVarName = (lastVar as unknown as { name: string }).name;
    const lastVarType = (lastVar as unknown as { type: string }).type;

    // Gera bloco 'Definir'
    const blockSet = document.createElement('block');
    blockSet.setAttribute('type', 'variables_set');
    blockSet.setAttribute('gap', '20');
    const fieldVar = document.createElement('field');
    fieldVar.setAttribute('name', 'VAR');
    fieldVar.setAttribute('id', lastVarId);
    fieldVar.setAttribute('variabletype', lastVarType);
    fieldVar.textContent = lastVarName;
    blockSet.appendChild(fieldVar);

    const valueElem = document.createElement('value');
    valueElem.setAttribute('name', 'VALUE');

    if (lastVarType === 'Number') {
      const shadowElem = document.createElement('shadow');
      shadowElem.setAttribute('type', 'math_number');
      const fieldNum = document.createElement('field');
      fieldNum.setAttribute('name', 'NUM');
      fieldNum.textContent = '0';
      shadowElem.appendChild(fieldNum);
      valueElem.appendChild(shadowElem);
    } else {
      const shadowElem = document.createElement('shadow');
      shadowElem.setAttribute('type', 'text');
      const fieldTxt = document.createElement('field');
      fieldTxt.setAttribute('name', 'TEXT');
      fieldTxt.textContent = '';
      shadowElem.appendChild(fieldTxt);
      valueElem.appendChild(shadowElem);
    }
    blockSet.appendChild(valueElem);
    xmlList.push(blockSet);

    // Gera bloco 'Alterar' (apenas variáveis numéricas)
    const anyNumberVar = allVars.find((v) => (v as unknown as { type: string }).type === 'Number');
    if (anyNumberVar) {
      const blockChange = document.createElement('block');
      blockChange.setAttribute('type', 'math_change');
      blockChange.setAttribute('gap', '32');
      const fieldVarChange = document.createElement('field');
      fieldVarChange.setAttribute('name', 'VAR');

      const targetId = lastVarType === 'Number' ? lastVarId : anyNumberVar.getId();
      const targetName = lastVarType === 'Number' ? lastVarName : (anyNumberVar as unknown as { name: string }).name;

      fieldVarChange.setAttribute('id', targetId);
      fieldVarChange.setAttribute('variabletype', 'Number');
      fieldVarChange.textContent = targetName;
      blockChange.appendChild(fieldVarChange);

      const valueChange = document.createElement('value');
      valueChange.setAttribute('name', 'DELTA');
      const shadowChange = document.createElement('shadow');
      shadowChange.setAttribute('type', 'math_number');
      const fieldNumChange = document.createElement('field');
      fieldNumChange.setAttribute('name', 'NUM');
      fieldNumChange.textContent = '1';
      shadowChange.appendChild(fieldNumChange);
      valueChange.appendChild(shadowChange);
      blockChange.appendChild(valueChange);

      xmlList.push(blockChange);
    }
  }

  // Gera blocos 'Obter' para todas as variáveis
  allVars.forEach((variable) => {
    const blockGet = document.createElement('block');
    blockGet.setAttribute('type', 'variables_get');
    blockGet.setAttribute('gap', '8');
    const fieldVar = document.createElement('field');
    fieldVar.setAttribute('name', 'VAR');
    fieldVar.setAttribute('id', variable.getId());
    fieldVar.setAttribute('variabletype', (variable as unknown as { type: string }).type);
    fieldVar.textContent = (variable as unknown as { name: string }).name;
    blockGet.appendChild(fieldVar);
    xmlList.push(blockGet);
  });

  // Gera blocos 'Mostrar/Esconder' variável (apenas modo Stage)
  if (!isUploadMode && allVars.length > 0) {
    const lastVar = allVars[allVars.length - 1];
    const lastVarName = (lastVar as unknown as { name: string }).name;
    const lastVarType = (lastVar as unknown as { type: string }).type;

    const blockShow = document.createElement('block');
    blockShow.setAttribute('type', 'data_showvariable');
    blockShow.setAttribute('gap', '8');
    const fieldShow = document.createElement('field');
    fieldShow.setAttribute('name', 'VAR');
    fieldShow.setAttribute('id', lastVar.getId());
    fieldShow.setAttribute('variabletype', lastVarType);
    fieldShow.textContent = lastVarName;
    blockShow.appendChild(fieldShow);
    xmlList.push(blockShow);

    const blockHide = document.createElement('block');
    blockHide.setAttribute('type', 'data_hidevariable');
    blockHide.setAttribute('gap', '8');
    const fieldHide = document.createElement('field');
    fieldHide.setAttribute('name', 'VAR');
    fieldHide.setAttribute('id', lastVar.getId());
    fieldHide.setAttribute('variabletype', lastVarType);
    fieldHide.textContent = lastVarName;
    blockHide.appendChild(fieldHide);
    xmlList.push(blockHide);
  }

  return xmlList;
};
