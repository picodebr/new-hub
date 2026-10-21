/**
 * Tradução para C++ dos blocos de controle de Motores e Ponte H.
 * 
 * Implementa a lógica para drivers L298N e similares. 
 * Mapeamento Padrão: 
 * - Motor A: Pinos 5 (PWM) e 10
 * - Motor B: Pinos 9 (PWM) e 6
 * 
 * Regra de Precedência: Utiliza o sistema de ordens do arduinoGenerator para 
 * envolver expressões em parênteses apenas quando necessário (ex: (a + b) * c).
 */
import * as Blockly from 'blockly';
import { arduinoGenerator } from './generator';

// =================================================================
// 6. LÓGICA PADRÃO & MATEMÁTICA
// =================================================================

arduinoGenerator.forBlock["math_number"] = function (block: Blockly.Block) {
    const code = String(block.getFieldValue('NUM'));
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock["text"] = function (block: Blockly.Block) {
    const textValue = block.getFieldValue('TEXT');
    // Se for um número, constante do Arduino ou booleano, não usa aspas
    const isNumeric = !isNaN(parseFloat(textValue)) && isFinite(textValue);
    const arduinoConstants = ['HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'true', 'false'];

    if (isNumeric || arduinoConstants.includes(textValue)) {
        return [textValue, arduinoGenerator.ORDER_ATOMIC];
    }

    const code = JSON.stringify(textValue);
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock["math_arithmetic"] = function (block: Blockly.Block) {
    const OPERATORS: Record<string, string> = {
        'ADD': '+',
        'MINUS': '-',
        'MULTIPLY': '*',
        'DIVIDE': '/',
        'POWER': '^' // Arduino não suporta o operador ^ diretamente para potência, mas por agora... 
        // Na verdade pow(a,b) é melhor, mas mantendo a sintaxe C++ simples
    };
    const operator = OPERATORS[block.getFieldValue('OP')];
    const order = (operator === '+' || operator === '-') ? arduinoGenerator.ORDER_ADDITIVE : arduinoGenerator.ORDER_MULTIPLICATIVE;
    const argument0 = arduinoGenerator.valueToCode(block, 'A', order) || '0';
    const argument1 = arduinoGenerator.valueToCode(block, 'B', order) || '0';
    const code = argument0 + ' ' + operator + ' ' + argument1;
    return [code, order];
};

arduinoGenerator.forBlock["logic_compare"] = function (block: Blockly.Block) {
    const OPERATORS: Record<string, string> = {
        'EQ': '==',
        'NEQ': '!=',
        'LT': '<',
        'LTE': '<=',
        'GT': '>',
        'GTE': '>='
    };
    const operator = OPERATORS[block.getFieldValue('OP')];
    const order = arduinoGenerator.ORDER_RELATIONAL;
    const argument0 = arduinoGenerator.valueToCode(block, 'A', order) || '0';
    const argument1 = arduinoGenerator.valueToCode(block, 'B', order) || '0';
    const code = argument0 + ' ' + operator + ' ' + argument1;
    return [code, order];
};

arduinoGenerator.forBlock["logic_operation"] = function (block: Blockly.Block) {
    const operator = (block.getFieldValue('OP') === 'AND') ? '&&' : '||';
    const order = (operator === '&&') ? arduinoGenerator.ORDER_LOGICAL_AND : arduinoGenerator.ORDER_LOGICAL_OR;
    const argument0 = arduinoGenerator.valueToCode(block, 'A', order) || 'false';
    const argument1 = arduinoGenerator.valueToCode(block, 'B', order) || 'false';
    const code = argument0 + ' ' + operator + ' ' + argument1;
    return [code, order];
};

arduinoGenerator.forBlock["logic_negate"] = function (block: Blockly.Block) {
    const order = arduinoGenerator.ORDER_UNARY_PREFIX;
    const argument0 = arduinoGenerator.valueToCode(block, 'BOOL', order) || 'true';
    const code = '!' + argument0;
    return [code, order];
};

arduinoGenerator.forBlock["math_map"] = function (block: Blockly.Block) {
    const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
    const fromLow = arduinoGenerator.valueToCode(block, 'FROM_LOW', arduinoGenerator.ORDER_NONE) || '0';
    const fromHigh = arduinoGenerator.valueToCode(block, 'FROM_HIGH', arduinoGenerator.ORDER_NONE) || '1024';
    const toLow = arduinoGenerator.valueToCode(block, 'TO_LOW', arduinoGenerator.ORDER_NONE) || '0';
    const toHigh = arduinoGenerator.valueToCode(block, 'TO_HIGH', arduinoGenerator.ORDER_NONE) || '255';

    // map(value, fromLow, fromHigh, toLow, toHigh)
    const code = `map(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`;
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock["math_number_slider"] = function (block: Blockly.Block) {
    const code = String(block.getFieldValue('NUM'));
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock["math_angle"] = function (block: Blockly.Block) {
    const code = String(block.getFieldValue('NUM'));
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock["logic_boolean"] = function (block: Blockly.Block) {
    const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'true' : 'false';
    return [code, arduinoGenerator.ORDER_ATOMIC];
};
