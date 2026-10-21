/**
 * Tradução para C++ dos blocos de variáveis e incremento.
 * 
 * Orquestra a declaração de variáveis globais e a manipulação de seus valores,
 * garantindo a tipagem correta (float para números, String para textos)
 * no escopo global (arduinoGenerator.definitions_).
 * 
 * Nota Técnica: Como o Blockly utiliza tipos dinâmicos, este gerador 
 * mapeia números para 'float' e textos para 'String' do Arduino, 
 * registrando-as no escopo global (arduinoGenerator.definitions_).
 */
import * as Blockly from 'blockly';
import { arduinoGenerator } from './generator';

// =================================================================
// 9. VARIÁVEIS
// =================================================================

arduinoGenerator.forBlock["variables_get"] = function (block: Blockly.Block) {
    const varId = block.getFieldValue('VAR');
    const variable = block.workspace.getVariableMap().getVariableById(varId);
    // Obtém nome sanitizado usando nameDB_ do gerador
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userVarName = variable ? (variable as any).name : varId;
    const varName = arduinoGenerator.nameDB_.getName(userVarName, Blockly.VARIABLE_CATEGORY_NAME);

    return [varName, arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock["variables_set"] = function (block: Blockly.Block) {
    const varId = block.getFieldValue('VAR');
    const variable = block.workspace.getVariableMap().getVariableById(varId);
    // Obtém nome sanitizado usando nameDB_ do gerador
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userVarName = variable ? (variable as any).name : varId;
    const varName = arduinoGenerator.nameDB_.getName(userVarName, Blockly.VARIABLE_CATEGORY_NAME);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const varType = variable ? (variable as any).type : 'Number';

    let argument0 = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ASSIGNMENT);

    // Se o input estiver vazio, usa valor padrão compatível com o tipo
    if (argument0 === null || argument0 === '') {
        argument0 = (varType === 'String') ? '""' : '0';
    }

    if (varType === 'String') {
        arduinoGenerator.definitions_['var_' + varName] = `String ${varName} = "";`;
    } else {
        arduinoGenerator.definitions_['var_' + varName] = `float ${varName} = 0;`;
    }

    return `${varName} = ${argument0};\n`;
};

arduinoGenerator.forBlock["math_change"] = function (block: Blockly.Block) {
    const varId = block.getFieldValue('VAR');
    const variable = block.workspace.getVariableMap().getVariableById(varId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userVarName = variable ? (variable as any).name : varId;
    const varName = arduinoGenerator.nameDB_.getName(userVarName, Blockly.VARIABLE_CATEGORY_NAME);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const varType = variable ? (variable as any).type : 'Number';

    const argument0 = arduinoGenerator.valueToCode(block, 'DELTA', arduinoGenerator.ORDER_ASSIGNMENT) || '0';

    // Garante definição (Numbers são float no Arduino deste projeto)
    if (varType === 'String') {
        arduinoGenerator.definitions_['var_' + varName] = `String ${varName} = "";`;
    } else {
        arduinoGenerator.definitions_['var_' + varName] = `float ${varName} = 0;`;
    }

    return `${varName} += ${argument0};\n`;
};
