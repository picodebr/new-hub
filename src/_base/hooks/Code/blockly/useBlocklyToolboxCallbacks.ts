/**
 * Setup dos Callbacks da Toolbox do Blockly.
 *
 * Responsabilidades:
 * 1. CUSTOM_VARIABLE — Categoria dinâmica de variáveis (Criar, Apagar, blocos set/get/change)
 * 2. MY_PROCEDURES — Categoria dinâmica de procedimentos customizados (Meus Blocos)
 * 3. Callbacks de botões (OPEN_VARIABLE_MODAL, OPEN_VARIABLE_DELETE_MODAL, CREATE_MY_BLOCK_BTN)
 */

import { RefObject } from 'react';
/**
 * Registro de callbacks para botões e eventos da toolbox.
 */
import * as Blockly from 'blockly/core';
import { getProjectService } from '@/_base/services/code';

export interface ToolboxCallbackHandlers {
  setIsVarModalOpen: (open: boolean) => void;
  setIsVarDeleteModalOpen: (open: boolean) => void;
  setIsListModalOpen: (open: boolean) => void;
  setIsListDeleteModalOpen: (open: boolean) => void;
  setIsProcModalOpen: (open: boolean) => void;
  setIsMLModalOpen: (open: boolean) => void;
  isUploadModeRef: RefObject<boolean>;
  activeSpriteIdRef?: RefObject<string>;
}

/**
 * Registra todos os callbacks da toolbox no workspace dado.
 */
export function registerToolboxCallbacks(workspace: Blockly.WorkspaceSvg, handlers: ToolboxCallbackHandlers): void {
  const {
    setIsVarModalOpen,
    setIsVarDeleteModalOpen,
    setIsListModalOpen,
    setIsListDeleteModalOpen,
    setIsProcModalOpen,
    setIsMLModalOpen,
    isUploadModeRef,
  } = handlers;

  // --- Button Callbacks ---
  workspace.registerButtonCallback('OPEN_VARIABLE_MODAL', () => {
    workspace.hideChaff();
    setIsVarModalOpen(true);
  });
  workspace.registerButtonCallback('OPEN_VARIABLE_DELETE_MODAL', () => {
    workspace.hideChaff();
    setIsVarDeleteModalOpen(true);
  });
  workspace.registerButtonCallback('OPEN_LIST_MODAL', () => {
    workspace.hideChaff();
    setIsListModalOpen(true);
  });
  workspace.registerButtonCallback('OPEN_LIST_DELETE_MODAL', () => {
    workspace.hideChaff();
    setIsListDeleteModalOpen(true);
  });
  workspace.registerButtonCallback('CREATE_MY_BLOCK_BTN', () => {
    workspace.hideChaff();
    setIsProcModalOpen(true);
  });

  // --- ML Callbacks ---
  workspace.registerButtonCallback('OPEN_ML_ENV', () => {
    workspace.hideChaff();
    setIsMLModalOpen(true);
  });
  workspace.registerButtonCallback('EDIT_ML_TRAIN', () => {
    workspace.hideChaff();
    setIsMLModalOpen(true);
  });
  workspace.registerButtonCallback('CHANGE_UPLOAD_ML_MODEL', () => {
    workspace.hideChaff();
    setIsMLModalOpen(true);
  });

  // --- CUSTOM_VARIABLE Category ---
  workspace.registerToolboxCategoryCallback('CUSTOM_VARIABLE', (ws) => {
    const mode = isUploadModeRef.current ? 'upload' : 'stage';
    const activeSpriteId = handlers.activeSpriteIdRef?.current;
    const currentVars = getProjectService().getUserVariables(mode, activeSpriteId);

    const xmlList: Element[] = [];

    // Botão Criar
    const btnCreate = document.createElement('button');
    btnCreate.setAttribute('text', 'Criar Variável');
    btnCreate.setAttribute('callbackKey', 'OPEN_VARIABLE_MODAL');
    xmlList.push(btnCreate);

    // Botão Apagar (Só mostra se houver variáveis)
    if (currentVars.length > 0) {
      const btnDelete = document.createElement('button');
      btnDelete.setAttribute('text', 'Apagar Variável');
      btnDelete.setAttribute('callbackKey', 'OPEN_VARIABLE_DELETE_MODAL');
      xmlList.push(btnDelete);
    }

    currentVars.forEach((v) => {
      const existing = ws.getVariableMap().getVariable(v.name, v.type);
      if (!existing) {
        ws.getVariableMap().createVariable(v.name, v.type, v.id);
      }
    });

    // Usa a lista do ProjectService como fonte de verdade, mapeando para o workspace
    const allVars = currentVars
      .map((cv) => {
        const wsVar = ws.getVariableMap().getVariable(cv.name, cv.type);
        return wsVar ? { name: cv.name, type: cv.type, getId: () => wsVar.getId() } : null;
      })
      .filter((v): v is { name: string; type: string; getId(): string } => v !== null);

    if (allVars.length > 0) {
      const lastVar = allVars[allVars.length - 1];
      const lastVarId = lastVar.getId();
      const lastVarName = lastVar.name;
      const lastVarType = lastVar.type;

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

      const anyNumberVar = allVars.find((v) => v.type === 'Number');
      if (anyNumberVar) {
        const blockChange = document.createElement('block');
        blockChange.setAttribute('type', 'math_change');
        blockChange.setAttribute('gap', '32');
        const fieldVarChange = document.createElement('field');
        fieldVarChange.setAttribute('name', 'VAR');
        const targetId = lastVarType === 'Number' ? lastVarId : anyNumberVar.getId();
        const targetName = lastVarType === 'Number' ? lastVarName : anyNumberVar.name;

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

    for (const variable of allVars) {
      const blockGet = document.createElement('block');
      blockGet.setAttribute('type', 'variables_get');
      blockGet.setAttribute('gap', '8');
      const fieldVar = document.createElement('field');
      fieldVar.setAttribute('name', 'VAR');
      fieldVar.setAttribute('id', variable.getId());
      fieldVar.setAttribute('variabletype', variable.type);
      fieldVar.textContent = variable.name;
      blockGet.appendChild(fieldVar);
      xmlList.push(blockGet);
    }

    // Blocos mostrar/esconder variável (apenas no modo Stage)
    if (!isUploadModeRef.current && allVars.length > 0) {
      const lastVar = allVars[allVars.length - 1];

      const blockShow = document.createElement('block');
      blockShow.setAttribute('type', 'data_showvariable');
      blockShow.setAttribute('gap', '8');
      const fieldShow = document.createElement('field');
      fieldShow.setAttribute('name', 'VAR');
      fieldShow.setAttribute('id', lastVar.getId());
      fieldShow.setAttribute('variabletype', lastVar.type);
      fieldShow.textContent = lastVar.name;
      blockShow.appendChild(fieldShow);
      xmlList.push(blockShow);

      const blockHide = document.createElement('block');
      blockHide.setAttribute('type', 'data_hidevariable');
      blockHide.setAttribute('gap', '8');
      const fieldHide = document.createElement('field');
      fieldHide.setAttribute('name', 'VAR');
      fieldHide.setAttribute('id', lastVar.getId());
      fieldHide.setAttribute('variabletype', lastVar.type);
      fieldHide.textContent = lastVar.name;
      blockHide.appendChild(fieldHide);
      xmlList.push(blockHide);
    }

    return xmlList;
  });

  // --- CUSTOM_LIST Category ---
  workspace.registerToolboxCategoryCallback('CUSTOM_LIST', (ws) => {
    const mode = isUploadModeRef.current ? 'upload' : 'stage';
    const activeSpriteId = handlers.activeSpriteIdRef?.current;
    const currentLists = getProjectService().getUserLists(mode, activeSpriteId);

    const xmlList: Element[] = [];

    // Botão Criar Lista
    const btnCreate = document.createElement('button');
    btnCreate.setAttribute('text', 'Criar Lista');
    btnCreate.setAttribute('callbackKey', 'OPEN_LIST_MODAL');
    xmlList.push(btnCreate);

    // Botão Apagar Lista (só se houver listas)
    if (currentLists.length > 0) {
      const btnDelete = document.createElement('button');
      btnDelete.setAttribute('text', 'Apagar Lista');
      btnDelete.setAttribute('callbackKey', 'OPEN_LIST_DELETE_MODAL');
      xmlList.push(btnDelete);
    }

    // Garante que as listas existam como variáveis Blockly com type="list"
    currentLists.forEach((l) => {
      const existing = ws.getVariableMap().getVariable(l.name, 'list');
      if (!existing) {
        ws.getVariableMap().createVariable(l.name, 'list', l.id);
      }
    });

    // Mapeia listas do ProjectService para variáveis do workspace
    const allLists = currentLists
      .map((cl) => {
        const wsVar = ws.getVariableMap().getVariable(cl.name, 'list');
        return wsVar ? { name: cl.name, getId: () => wsVar.getId() } : null;
      })
      .filter((l): l is { name: string; getId(): string } => l !== null);

    if (allLists.length === 0) return xmlList;

    const lastList = allLists[allLists.length - 1];
    const lastListId = lastList.getId();
    const lastListName = lastList.name;

    // Bloco: adicionar à lista
    const blockAdd = document.createElement('block');
    blockAdd.setAttribute('type', 'data_addtolist');
    blockAdd.setAttribute('gap', '8');
    const fieldAdd = document.createElement('field');
    fieldAdd.setAttribute('name', 'LIST');
    fieldAdd.setAttribute('id', lastListId);
    fieldAdd.setAttribute('variabletype', 'list');
    fieldAdd.textContent = lastListName;
    const valueAdd = document.createElement('value');
    valueAdd.setAttribute('name', 'ITEM');
    const shadowAdd = document.createElement('shadow');
    shadowAdd.setAttribute('type', 'text');
    const fieldTxt = document.createElement('field');
    fieldTxt.setAttribute('name', 'TEXT');
    fieldTxt.textContent = 'coisa';
    shadowAdd.appendChild(fieldTxt);
    valueAdd.appendChild(shadowAdd);
    blockAdd.appendChild(fieldAdd);
    blockAdd.appendChild(valueAdd);
    xmlList.push(blockAdd);

    // Bloco: apagar item de lista
    const blockDel = document.createElement('block');
    blockDel.setAttribute('type', 'data_deleteoflist');
    blockDel.setAttribute('gap', '8');
    const fieldDel = document.createElement('field');
    fieldDel.setAttribute('name', 'LIST');
    fieldDel.setAttribute('id', lastListId);
    fieldDel.setAttribute('variabletype', 'list');
    fieldDel.textContent = lastListName;
    const valueDel = document.createElement('value');
    valueDel.setAttribute('name', 'INDEX');
    const shadowDel = document.createElement('shadow');
    shadowDel.setAttribute('type', 'math_number');
    const fieldNumDel = document.createElement('field');
    fieldNumDel.setAttribute('name', 'NUM');
    fieldNumDel.textContent = '1';
    shadowDel.appendChild(fieldNumDel);
    valueDel.appendChild(shadowDel);
    blockDel.appendChild(fieldDel);
    blockDel.appendChild(valueDel);
    xmlList.push(blockDel);

    // Bloco: apagar todos
    const blockDelAll = document.createElement('block');
    blockDelAll.setAttribute('type', 'data_deletealloflist');
    blockDelAll.setAttribute('gap', '8');
    const fieldDelAll = document.createElement('field');
    fieldDelAll.setAttribute('name', 'LIST');
    fieldDelAll.setAttribute('id', lastListId);
    fieldDelAll.setAttribute('variabletype', 'list');
    fieldDelAll.textContent = lastListName;
    blockDelAll.appendChild(fieldDelAll);
    xmlList.push(blockDelAll);

    // Bloco: inserir na posição
    const blockIns = document.createElement('block');
    blockIns.setAttribute('type', 'data_insertatlist');
    blockIns.setAttribute('gap', '8');
    const fieldIns = document.createElement('field');
    fieldIns.setAttribute('name', 'LIST');
    fieldIns.setAttribute('id', lastListId);
    fieldIns.setAttribute('variabletype', 'list');
    fieldIns.textContent = lastListName;
    const valueInsItem = document.createElement('value');
    valueInsItem.setAttribute('name', 'ITEM');
    const shadowInsItem = document.createElement('shadow');
    shadowInsItem.setAttribute('type', 'text');
    const fieldInsText = document.createElement('field');
    fieldInsText.setAttribute('name', 'TEXT');
    fieldInsText.textContent = 'coisa';
    shadowInsItem.appendChild(fieldInsText);
    valueInsItem.appendChild(shadowInsItem);
    const valueInsIdx = document.createElement('value');
    valueInsIdx.setAttribute('name', 'INDEX');
    const shadowInsIdx = document.createElement('shadow');
    shadowInsIdx.setAttribute('type', 'math_number');
    const fieldInsNum = document.createElement('field');
    fieldInsNum.setAttribute('name', 'NUM');
    fieldInsNum.textContent = '1';
    shadowInsIdx.appendChild(fieldInsNum);
    valueInsIdx.appendChild(shadowInsIdx);
    blockIns.appendChild(fieldIns);
    blockIns.appendChild(valueInsItem);
    blockIns.appendChild(valueInsIdx);
    xmlList.push(blockIns);

    // Bloco: substituir item
    const blockRepl = document.createElement('block');
    blockRepl.setAttribute('type', 'data_replaceitemoflist');
    blockRepl.setAttribute('gap', '20');
    const fieldRepl = document.createElement('field');
    fieldRepl.setAttribute('name', 'LIST');
    fieldRepl.setAttribute('id', lastListId);
    fieldRepl.setAttribute('variabletype', 'list');
    fieldRepl.textContent = lastListName;
    const valueReplIdx = document.createElement('value');
    valueReplIdx.setAttribute('name', 'INDEX');
    const shadowReplIdx = document.createElement('shadow');
    shadowReplIdx.setAttribute('type', 'math_number');
    const fieldReplNum = document.createElement('field');
    fieldReplNum.setAttribute('name', 'NUM');
    fieldReplNum.textContent = '1';
    shadowReplIdx.appendChild(fieldReplNum);
    valueReplIdx.appendChild(shadowReplIdx);
    const valueReplItem = document.createElement('value');
    valueReplItem.setAttribute('name', 'ITEM');
    const shadowReplItem = document.createElement('shadow');
    shadowReplItem.setAttribute('type', 'text');
    const fieldReplText = document.createElement('field');
    fieldReplText.setAttribute('name', 'TEXT');
    fieldReplText.textContent = 'coisa';
    shadowReplItem.appendChild(fieldReplText);
    valueReplItem.appendChild(shadowReplItem);
    blockRepl.appendChild(fieldRepl);
    blockRepl.appendChild(valueReplIdx);
    blockRepl.appendChild(valueReplItem);
    xmlList.push(blockRepl);

    // Reporters para cada lista
    for (const lst of allLists) {
      // conteúdo de lista (data_listcontents)
      const blockContents = document.createElement('block');
      blockContents.setAttribute('type', 'data_listcontents');
      blockContents.setAttribute('gap', '8');
      const fieldContents = document.createElement('field');
      fieldContents.setAttribute('name', 'LIST');
      fieldContents.setAttribute('id', lst.getId());
      fieldContents.setAttribute('variabletype', 'list');
      fieldContents.textContent = lst.name;
      blockContents.appendChild(fieldContents);
      xmlList.push(blockContents);

      // item de lista (reporter)
      const blockItem = document.createElement('block');
      blockItem.setAttribute('type', 'data_itemoflist');
      blockItem.setAttribute('gap', '8');
      const fieldItem = document.createElement('field');
      fieldItem.setAttribute('name', 'LIST');
      fieldItem.setAttribute('id', lst.getId());
      fieldItem.setAttribute('variabletype', 'list');
      fieldItem.textContent = lst.name;
      const valueItemIdx = document.createElement('value');
      valueItemIdx.setAttribute('name', 'INDEX');
      const shadowItemIdx = document.createElement('shadow');
      shadowItemIdx.setAttribute('type', 'math_number');
      const fieldItemNum = document.createElement('field');
      fieldItemNum.setAttribute('name', 'NUM');
      fieldItemNum.textContent = '1';
      shadowItemIdx.appendChild(fieldItemNum);
      valueItemIdx.appendChild(shadowItemIdx);
      blockItem.appendChild(fieldItem);
      blockItem.appendChild(valueItemIdx);
      xmlList.push(blockItem);

      // posição de item em lista
      const blockPos = document.createElement('block');
      blockPos.setAttribute('type', 'data_itemnumoflist');
      blockPos.setAttribute('gap', '8');
      const fieldPos = document.createElement('field');
      fieldPos.setAttribute('name', 'LIST');
      fieldPos.setAttribute('id', lst.getId());
      fieldPos.setAttribute('variabletype', 'list');
      fieldPos.textContent = lst.name;
      const valuePosItem = document.createElement('value');
      valuePosItem.setAttribute('name', 'ITEM');
      const shadowPosItem = document.createElement('shadow');
      shadowPosItem.setAttribute('type', 'text');
      const fieldPosText = document.createElement('field');
      fieldPosText.setAttribute('name', 'TEXT');
      fieldPosText.textContent = 'coisa';
      shadowPosItem.appendChild(fieldPosText);
      valuePosItem.appendChild(shadowPosItem);
      blockPos.appendChild(fieldPos);
      blockPos.appendChild(valuePosItem);
      xmlList.push(blockPos);

      // comprimento
      const blockLen = document.createElement('block');
      blockLen.setAttribute('type', 'data_lengthoflist');
      blockLen.setAttribute('gap', '8');
      const fieldLen = document.createElement('field');
      fieldLen.setAttribute('name', 'LIST');
      fieldLen.setAttribute('id', lst.getId());
      fieldLen.setAttribute('variabletype', 'list');
      fieldLen.textContent = lst.name;
      blockLen.appendChild(fieldLen);
      xmlList.push(blockLen);

      // contém item?
      const blockContains = document.createElement('block');
      blockContains.setAttribute('type', 'data_listcontainsitem');
      blockContains.setAttribute('gap', '16');
      const fieldContains = document.createElement('field');
      fieldContains.setAttribute('name', 'LIST');
      fieldContains.setAttribute('id', lst.getId());
      fieldContains.setAttribute('variabletype', 'list');
      fieldContains.textContent = lst.name;
      const valueContainsItem = document.createElement('value');
      valueContainsItem.setAttribute('name', 'ITEM');
      const shadowContains = document.createElement('shadow');
      shadowContains.setAttribute('type', 'text');
      const fieldContText = document.createElement('field');
      fieldContText.setAttribute('name', 'TEXT');
      fieldContText.textContent = 'coisa';
      shadowContains.appendChild(fieldContText);
      valueContainsItem.appendChild(shadowContains);
      blockContains.appendChild(fieldContains);
      blockContains.appendChild(valueContainsItem);
      xmlList.push(blockContains);
    }

    // Mostrar/esconder lista (apenas no modo Stage)
    if (!isUploadModeRef.current) {
      const blockShow = document.createElement('block');
      blockShow.setAttribute('type', 'data_showlist');
      blockShow.setAttribute('gap', '8');
      const fieldShow = document.createElement('field');
      fieldShow.setAttribute('name', 'LIST');
      fieldShow.setAttribute('id', lastListId);
      fieldShow.setAttribute('variabletype', 'list');
      fieldShow.textContent = lastListName;
      blockShow.appendChild(fieldShow);
      xmlList.push(blockShow);

      const blockHide = document.createElement('block');
      blockHide.setAttribute('type', 'data_hidelist');
      blockHide.setAttribute('gap', '8');
      const fieldHide = document.createElement('field');
      fieldHide.setAttribute('name', 'LIST');
      fieldHide.setAttribute('id', lastListId);
      fieldHide.setAttribute('variabletype', 'list');
      fieldHide.textContent = lastListName;
      blockHide.appendChild(fieldHide);
      xmlList.push(blockHide);
    }

    return xmlList;
  });

  // --- MY_PROCEDURES Category ---
  workspace.registerToolboxCategoryCallback('MY_PROCEDURES', (ws) => {
    const xmlList: Element[] = [];

    const btnCreate = document.createElement('button');
    btnCreate.setAttribute('text', 'Criar um Bloco');
    btnCreate.setAttribute('callbackKey', 'CREATE_MY_BLOCK_BTN');
    xmlList.push(btnCreate);

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
  });
}
