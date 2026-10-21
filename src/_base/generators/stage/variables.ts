/**
 * Tradução para JavaScript dos blocos de interação com a Placa (via Firmata) no modo Stage.
 * 
 * Permite simular o comportamento do hardware no navegador, redirecionando os 
 * comandos para o StageBoard proxy que se comunica via porta serial real.
 */
/**
 * Tradução para JavaScript dos blocos de variáveis e incremento.
 * 
 * Estratégia de Persistência (Scratch Parity):
 * Variáveis são armazenadas em `window.__var_NOME` dentro do iframe de execução.
 * Isso garante que o valor persista entre disparos de diferentes eventos 
 * (ex: clicar na bandeira e depois apertar uma tecla) sem resetar o estado.
 */
import { javascriptGenerator, Order } from 'blockly/javascript';
import * as Blockly from 'blockly/core';

/**
 * Estratégia idêntica ao Scratch:
 * Variáveis ficam em `window.varName` no iframe — persistindo entre eventos.
 * 
 * Cada bloco gera código que lê/escreve em `window.*` em vez de variáveis locais.
 * Isso garante que:
 *   - O valor persiste entre cliques na Bandeira Verde
 *   - O valor persiste entre diferentes eventos (teclado, etc.)
 *   - Todos os sprites compartilham o mesmo "estágio global"
 */
export const initVariablesGenerators = () => {

    // 1. variables_get (Ler variável)
    javascriptGenerator.forBlock['variables_get'] = function (block: Blockly.Block) {
        const varId = block.getFieldValue('VAR');
        const variable = block.workspace.getVariableMap().getVariableById(varId);
        const userVarName = variable ? (variable as unknown as { name: string }).name : varId;
        const varType = variable ? (variable as unknown as { type: string }).type : '';

        const nameDB = (javascriptGenerator as unknown as { nameDB_: Blockly.Names }).nameDB_;
        const safeName = nameDB
            ? nameDB.getName(userVarName, Blockly.Names.NameType.VARIABLE)
            : userVarName;

        // Garante valor padrão correto para evitar undefined em cálculos matemáticos
        const defaultVal = varType === 'String' ? "''" : '0';
        return [`(window.__var_${safeName} ?? ${defaultVal})`, Order.LOGICAL_OR];
    };

    // 2. variables_set (Definir variável)
    javascriptGenerator.forBlock['variables_set'] = function (block: Blockly.Block) {
        const varId = block.getFieldValue('VAR');
        const variable = block.workspace.getVariableMap().getVariableById(varId);
        const userVarName = variable ? (variable as unknown as { name: string }).name : varId;

        const nameDB = (javascriptGenerator as unknown as { nameDB_: Blockly.Names }).nameDB_;
        const safeName = nameDB
            ? nameDB.getName(userVarName, Blockly.Names.NameType.VARIABLE)
            : userVarName;

        const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';

        // Escreve no objeto global window (persistente entre execuções) e notifica o monitor
        return `window.__var_${safeName} = ${argument0};\nif(window.__picoUpdateVarMonitor) window.__picoUpdateVarMonitor('var_${varId}', window.__var_${safeName});\n`;
    };

    // 3. math_change (Adicionar à variável — Ex: "mude Var por 1")
    javascriptGenerator.forBlock['math_change'] = function (block: Blockly.Block) {
        const varId = block.getFieldValue('VAR');
        const variable = block.workspace.getVariableMap().getVariableById(varId);
        const userVarName = variable ? (variable as unknown as { name: string }).name : varId;
        
        const nameDB = (javascriptGenerator as unknown as { nameDB_: Blockly.Names }).nameDB_;
        const safeName = nameDB
            ? nameDB.getName(userVarName, Blockly.Names.NameType.VARIABLE)
            : userVarName;

        const argument0 = javascriptGenerator.valueToCode(block, 'DELTA', Order.ADDITION) || '0';
        const ref = `window.__var_${safeName}`;

        return `${ref} = (typeof ${ref} === 'number' ? ${ref} : 0) + (${argument0});\nif(window.__picoUpdateVarMonitor) window.__picoUpdateVarMonitor('var_${varId}', ${ref});\n`;
    };

    // 4. data_showvariable (Mostrar monitor da variável)
    javascriptGenerator.forBlock['data_showvariable'] = function (block: Blockly.Block) {
        const varId = block.getFieldValue('VAR');
        const variable = block.workspace.getVariableMap().getVariableById(varId);
        const userVarName = variable ? (variable as unknown as { name: string }).name : varId;
        return `if (window.__picoShowMonitor) window.__picoShowMonitor('var_${varId}', '${userVarName.replace(/'/g, "\\'")}');\n`;
    };

    // 5. data_hidevariable (Esconder monitor da variável)
    javascriptGenerator.forBlock['data_hidevariable'] = function (block: Blockly.Block) {
        const varId = block.getFieldValue('VAR');
        const variable = block.workspace.getVariableMap().getVariableById(varId);
        const userVarName = variable ? (variable as unknown as { name: string }).name : varId;
        return `if (window.__picoHideMonitor) window.__picoHideMonitor('var_${varId}', '${userVarName.replace(/'/g, "\\'")}');\n`;
    };

    // ── Listas ──────────────────────────────────────────────

    // Helper para obter a referência de lista no window
    const _listRef = (block: Blockly.Block) => {
        const listId = block.getFieldValue('LIST');
        return `(window.__list_${listId} = window.__list_${listId} || [])`;
    };

    // Helper para notificar o monitor após modificação de lista (sandbox path)
    const _syncMonitor = (listId: string) =>
        `if(window.__picoUpdateListMonitor) window.__picoUpdateListMonitor('list_${listId}', window.__list_${listId});\n`;

    // data_addtolist
    javascriptGenerator.forBlock['data_addtolist'] = function (block: Blockly.Block) {
        const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || "''";
        const listId = block.getFieldValue('LIST');
        const ref = _listRef(block);
        return `${ref}.push(${item}); ${_syncMonitor(listId)}`;
    };

    // data_deleteoflist
    javascriptGenerator.forBlock['data_deleteoflist'] = function (block: Blockly.Block) {
        const index = javascriptGenerator.valueToCode(block, 'INDEX', Order.NONE) || '1';
        const listId = block.getFieldValue('LIST');
        const ref = `(window.__list_${listId} = window.__list_${listId} || [])`;
        return `{ const __idx = ${index} === 'last' ? ${ref}.length - 1 : ${index} === 'random' ? Math.floor(Math.random() * ${ref}.length) : Number(${index}) - 1; if (__idx >= 0 && __idx < ${ref}.length) ${ref}.splice(__idx, 1); } ${_syncMonitor(listId)}`;
    };

    // data_deletealloflist
    javascriptGenerator.forBlock['data_deletealloflist'] = function (block: Blockly.Block) {
        const listId = block.getFieldValue('LIST');
        return `window.__list_${listId} = []; ${_syncMonitor(listId)}`;
    };

    // data_insertatlist
    javascriptGenerator.forBlock['data_insertatlist'] = function (block: Blockly.Block) {
        const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || "''";
        const index = javascriptGenerator.valueToCode(block, 'INDEX', Order.NONE) || '1';
        const listId = block.getFieldValue('LIST');
        const ref = _listRef(block);
        return `{ const __idx = Number(${index}) - 1; ${ref}.splice(Math.max(0, __idx), 0, ${item}); } ${_syncMonitor(listId)}`;
    };

    // data_replaceitemoflist
    javascriptGenerator.forBlock['data_replaceitemoflist'] = function (block: Blockly.Block) {
        const index = javascriptGenerator.valueToCode(block, 'INDEX', Order.NONE) || '1';
        const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || "''";
        const listId = block.getFieldValue('LIST');
        const ref = _listRef(block);
        return `{ const __idx = Number(${index}) - 1; if (__idx >= 0 && __idx < ${ref}.length) ${ref}[__idx] = ${item}; } ${_syncMonitor(listId)}`;
    };

    // data_showlist / data_hidelist
    javascriptGenerator.forBlock['data_showlist'] = function (block: Blockly.Block) {
        const listId = block.getFieldValue('LIST');
        const listVar = block.workspace.getVariableMap().getVariableById(listId);
        const listName = listVar ? (listVar as unknown as { name: string }).name : listId;
        return `if (window.__picoShowMonitor) window.__picoShowMonitor('list_${listId}', '${listName.replace(/'/g, "\\'")}');\n`;
    };
    javascriptGenerator.forBlock['data_hidelist'] = function (block: Blockly.Block) {
        const listId = block.getFieldValue('LIST');
        const listVar = block.workspace.getVariableMap().getVariableById(listId);
        const listName = listVar ? (listVar as unknown as { name: string }).name : listId;
        return `if (window.__picoHideMonitor) window.__picoHideMonitor('list_${listId}', '${listName.replace(/'/g, "\\'")}');\n`;
    };

    // data_listcontents (reporter - conteúdo completo como string para o monitor)
    javascriptGenerator.forBlock['data_listcontents'] = function (block: Blockly.Block) {
        const listId = block.getFieldValue('LIST');
        return [`(window.__list_${listId} || []).join('\\n')`, Order.MEMBER];
    };

    // data_itemoflist (reporter)
    javascriptGenerator.forBlock['data_itemoflist'] = function (block: Blockly.Block) {
        const index = javascriptGenerator.valueToCode(block, 'INDEX', Order.NONE) || '1';
        const listId = block.getFieldValue('LIST');
        const ref = `(window.__list_${listId} || [])`;
        return [`(function(){ const __idx = ${index} === 'last' ? ${ref}.length - 1 : ${index} === 'random' ? Math.floor(Math.random() * ${ref}.length) : Number(${index}) - 1; return (__idx >= 0 && __idx < ${ref}.length) ? ${ref}[__idx] : ''; })()`, Order.FUNCTION_CALL];
    };

    // data_itemnumoflist (reporter)
    javascriptGenerator.forBlock['data_itemnumoflist'] = function (block: Blockly.Block) {
        const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || "''";
        const listId = block.getFieldValue('LIST');
        const ref = `(window.__list_${listId} || [])`;
        return [`(function(){ const __pos = ${ref}.findIndex(el => String(el).toLowerCase() === String(${item}).toLowerCase()); return __pos >= 0 ? __pos + 1 : 0; })()`, Order.FUNCTION_CALL];
    };

    // data_lengthoflist (reporter)
    javascriptGenerator.forBlock['data_lengthoflist'] = function (block: Blockly.Block) {
        const listId = block.getFieldValue('LIST');
        return [`(window.__list_${listId} || []).length`, Order.MEMBER];
    };

    // data_listcontainsitem (reporter boolean)
    javascriptGenerator.forBlock['data_listcontainsitem'] = function (block: Blockly.Block) {
        const item = javascriptGenerator.valueToCode(block, 'ITEM', Order.NONE) || "''";
        const listId = block.getFieldValue('LIST');
        const ref = `(window.__list_${listId} || [])`;
        return [`${ref}.some(el => String(el).toLowerCase() === String(${item}).toLowerCase())`, Order.FUNCTION_CALL];
    };
};
