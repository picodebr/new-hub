/**
 * Tradução para JavaScript dos blocos de Operadores (Aritmética, Lógica, Strings, Mathop).
 */
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const initOperatorsGenerators = () => {
    
    // --- ARITMÉTICA CONSOLIDADA (Pedido do Usuário) ---
    javascriptGenerator.forBlock['operator_arithmetic'] = function (block: Blockly.Block) {
        const op = block.getFieldValue('OP');
        const num1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.ADDITION) || '0';
        const num2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.ADDITION) || '0';
        
        const OPERATORS: Record<string, [string, Order]> = {
            'ADD': [' + ', Order.ADDITION],
            'SUBTRACT': [' - ', Order.SUBTRACTION],
            'MULTIPLY': [' * ', Order.MULTIPLICATION],
            'DIVIDE': [' / ', Order.DIVISION],
        };
        const [operator, order] = OPERATORS[op];
        return [`(Number(${num1}) ${operator} Number(${num2}))`, order];
    };

    // --- ARITMÉTICA ---
    javascriptGenerator.forBlock['operator_add'] = function (block: Blockly.Block) {
        const num1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.ADDITION) || '0';
        const num2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.ADDITION) || '0';
        return [`(Number(${num1}) + Number(${num2}))`, Order.ADDITION];
    };

    javascriptGenerator.forBlock['operator_subtract'] = function (block: Blockly.Block) {
        const num1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.SUBTRACTION) || '0';
        const num2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.SUBTRACTION) || '0';
        return [`(Number(${num1}) - Number(${num2}))`, Order.SUBTRACTION];
    };

    javascriptGenerator.forBlock['operator_multiply'] = function (block: Blockly.Block) {
        const num1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.MULTIPLICATION) || '0';
        const num2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.MULTIPLICATION) || '0';
        return [`(Number(${num1}) * Number(${num2}))`, Order.MULTIPLICATION];
    };

    javascriptGenerator.forBlock['operator_divide'] = function (block: Blockly.Block) {
        const num1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.DIVISION) || '0';
        const num2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.DIVISION) || '1';
        return [`(Number(${num1}) / Number(${num2}))`, Order.DIVISION];
    };

    // --- ALEATÓRIO ---
    javascriptGenerator.forBlock['operator_random'] = function (block: Blockly.Block) {
        const from = javascriptGenerator.valueToCode(block, 'FROM', Order.COMMA) || '1';
        const to = javascriptGenerator.valueToCode(block, 'TO', Order.COMMA) || '10';
        // Scratch random: Includes both bounds. Handles float vs int automatically.
        const code = `(() => {
            const low = Number(${from});
            const high = Number(${to});
            const min = Math.min(low, high);
            const max = Math.max(low, high);
            if (min % 1 === 0 && max % 1 === 0) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            return Math.random() * (max - min) + min;
        })()`;
        return [code, Order.ATOMIC];
    };

    // --- COMPARAÇÃO (Scratch parity: case-insensitive for strings) ---
    javascriptGenerator.forBlock['operator_gt'] = function (block: Blockly.Block) {
        const v1 = javascriptGenerator.valueToCode(block, 'OPERAND1', Order.RELATIONAL) || '0';
        const v2 = javascriptGenerator.valueToCode(block, 'OPERAND2', Order.RELATIONAL) || '0';
        return [`(Number(${v1}) > Number(${v2}))`, Order.RELATIONAL];
    };

    javascriptGenerator.forBlock['operator_lt'] = function (block: Blockly.Block) {
        const v1 = javascriptGenerator.valueToCode(block, 'OPERAND1', Order.RELATIONAL) || '0';
        const v2 = javascriptGenerator.valueToCode(block, 'OPERAND2', Order.RELATIONAL) || '0';
        return [`(Number(${v1}) < Number(${v2}))`, Order.RELATIONAL];
    };

    javascriptGenerator.forBlock['operator_equals'] = function (block: Blockly.Block) {
        const v1 = javascriptGenerator.valueToCode(block, 'OPERAND1', Order.EQUALITY) || '""';
        const v2 = javascriptGenerator.valueToCode(block, 'OPERAND2', Order.EQUALITY) || '""';
        const code = `(String(${v1}).toLowerCase() === String(${v2}).toLowerCase())`;
        return [code, Order.EQUALITY];
    };

    // --- LÓGICA ---
    javascriptGenerator.forBlock['operator_and'] = function (block: Blockly.Block) {
        const a = javascriptGenerator.valueToCode(block, 'OPERAND1', Order.LOGICAL_AND) || 'false';
        const b = javascriptGenerator.valueToCode(block, 'OPERAND2', Order.LOGICAL_AND) || 'false';
        return [`(${a} && ${b})`, Order.LOGICAL_AND];
    };

    javascriptGenerator.forBlock['operator_or'] = function (block: Blockly.Block) {
        const a = javascriptGenerator.valueToCode(block, 'OPERAND1', Order.LOGICAL_OR) || 'false';
        const b = javascriptGenerator.valueToCode(block, 'OPERAND2', Order.LOGICAL_OR) || 'false';
        return [`(${a} || ${b})`, Order.LOGICAL_OR];
    };

    javascriptGenerator.forBlock['operator_not'] = function (block: Blockly.Block) {
        const op = javascriptGenerator.valueToCode(block, 'OPERAND', Order.LOGICAL_NOT) || 'false';
        return [`(!${op})`, Order.LOGICAL_NOT];
    };

    // --- STRINGS ---
    javascriptGenerator.forBlock['operator_join'] = function (block: Blockly.Block) {
        const s1 = javascriptGenerator.valueToCode(block, 'STRING1', Order.ADDITION) || '""';
        const s2 = javascriptGenerator.valueToCode(block, 'STRING2', Order.ADDITION) || '""';
        return [`(String(${s1}) + String(${s2}))`, Order.ADDITION];
    };

    javascriptGenerator.forBlock['operator_letter_of'] = function (block: Blockly.Block) {
        const letter = javascriptGenerator.valueToCode(block, 'LETTER', Order.COMMA) || '1';
        const string = javascriptGenerator.valueToCode(block, 'STRING', Order.COMMA) || '""';
        return [`String(${string}).charAt(Number(${letter}) - 1)`, Order.MEMBER];
    };

    javascriptGenerator.forBlock['operator_length'] = function (block: Blockly.Block) {
        const string = javascriptGenerator.valueToCode(block, 'STRING', Order.MEMBER) || '""';
        return [`String(${string}).length`, Order.MEMBER];
    };

    javascriptGenerator.forBlock['operator_contains'] = function (block: Blockly.Block) {
        const s1 = javascriptGenerator.valueToCode(block, 'STRING1', Order.COMMA) || '""';
        const s2 = javascriptGenerator.valueToCode(block, 'STRING2', Order.COMMA) || '""';
        return [`String(${s1}).toLowerCase().includes(String(${s2}).toLowerCase())`, Order.ATOMIC];
    };

    // --- MATEMÁTICA ---
    javascriptGenerator.forBlock['operator_mod'] = function (block: Blockly.Block) {
        const n1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.MULTIPLICATION) || '0';
        const n2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.MULTIPLICATION) || '1';
        return [`(Number(${n1}) % Number(${n2}))`, Order.MULTIPLICATION];
    };

    javascriptGenerator.forBlock['operator_round'] = function (block: Blockly.Block) {
        const num = javascriptGenerator.valueToCode(block, 'NUM', Order.COMMA) || '0';
        return [`Math.round(Number(${num}))`, Order.ATOMIC];
    };

    javascriptGenerator.forBlock['operator_map'] = function (block: Blockly.Block) {
        const value    = javascriptGenerator.valueToCode(block, 'VALUE',     Order.COMMA) || '0';
        const fromLow  = javascriptGenerator.valueToCode(block, 'FROM_LOW',  Order.COMMA) || '0';
        const fromHigh = javascriptGenerator.valueToCode(block, 'FROM_HIGH', Order.COMMA) || '1023';
        const toLow    = javascriptGenerator.valueToCode(block, 'TO_LOW',    Order.COMMA) || '0';
        const toHigh   = javascriptGenerator.valueToCode(block, 'TO_HIGH',   Order.COMMA) || '100';
        const code = `((${value} - ${fromLow}) * (${toHigh} - ${toLow}) / (${fromHigh} - ${fromLow}) + ${toLow})`;
        return [code, Order.ADDITION];
    };

    javascriptGenerator.forBlock['operator_mathop'] = function (block: Blockly.Block) {
        const op = block.getFieldValue('OPERATOR');
        const num = javascriptGenerator.valueToCode(block, 'NUM', Order.COMMA) || '0';
        let code = '';
        switch(op) {
            case 'abs': code = `Math.abs(Number(${num}))`; break;
            case 'floor': code = `Math.floor(Number(${num}))`; break;
            case 'ceiling': code = `Math.ceil(Number(${num}))`; break;
            case 'sqrt': code = `Math.sqrt(Number(${num}))`; break;
            case 'sin': code = `Math.sin(Number(${num}) * Math.PI / 180)`; break;
            case 'cos': code = `Math.cos(Number(${num}) * Math.PI / 180)`; break;
            case 'tan': code = `Math.tan(Number(${num}) * Math.PI / 180)`; break;
            case 'asin': code = `Math.asin(Number(${num})) * 180 / Math.PI`; break;
            case 'acos': code = `Math.acos(Number(${num})) * 180 / Math.PI`; break;
            case 'atan': code = `Math.atan(Number(${num})) * 180 / Math.PI`; break;
            case 'ln': code = `Math.log(Number(${num}))`; break;
            case 'log': code = `Math.log10(Number(${num}))`; break;
            case 'e^': code = `Math.exp(Number(${num}))`; break;
            case '10^': code = `Math.pow(10, Number(${num}))`; break;
        }
        return [code, Order.ATOMIC];
    };

};
