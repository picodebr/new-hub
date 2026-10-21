/**
 * Tradução para JavaScript dos blocos de Lógica e Matemática para o modo Stage.
 */
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const initMathGenerators = () => {
    // Aritmética básica (Stage) - Garante conversão para número como no Scratch
    javascriptGenerator.forBlock['math_arithmetic'] = function (block: Blockly.Block) {
        const OPERATORS: Record<string, [string | null, Order]> = {
            'ADD': [' + ', Order.ADDITION],
            'MINUS': [' - ', Order.ADDITION],
            'MULTIPLY': [' * ', Order.MULTIPLICATION],
            'DIVIDE': [' / ', Order.MULTIPLICATION],
            'POWER': [null, Order.EXPONENTIATION],
        };
        const tuple = OPERATORS[block.getFieldValue('OP')];
        const operator = tuple[0];
        const order = tuple[1];
        const argument0 = javascriptGenerator.valueToCode(block, 'A', Order.ATOMIC) || '0';
        const argument1 = javascriptGenerator.valueToCode(block, 'B', Order.ATOMIC) || '0';
        let code;
        if (!operator) {
            code = `Math.pow(Number(${argument0}), Number(${argument1}))`;
            return [code, Order.FUNCTION_CALL];
        }
        // No Scratch, 1 + "1" = 2. Em JS puro 1 + "1" = "11". 
        // Forçamos Number() para manter paridade.
        code = `(Number(${argument0}) ${operator} Number(${argument1}))`;
        return [code, order];
    };

    // Comparações (Scratch-style: 1 + 1 == '2' é true, e "abc" == "ABC" é true)
    javascriptGenerator.forBlock['logic_compare'] = function (block: Blockly.Block) {
        const OPERATORS: Record<string, string> = {
            'EQ': '==',
            'NEQ': '!=',
            'LT': '<',
            'LTE': '<=',
            'GT': '>',
            'GTE': '>='
        };
        const operator = OPERATORS[block.getFieldValue('OP')];
        const argument0 = javascriptGenerator.valueToCode(block, 'A', Order.ATOMIC) || '0';
        const argument1 = javascriptGenerator.valueToCode(block, 'B', Order.ATOMIC) || '0';

        const code = `stage.compare(${argument0}, ${argument1}, '${operator}')`;
        return [code, Order.FUNCTION_CALL];
    };

    // Utils: Map (Não é exclusivo de Board, mas estava na lista)
    javascriptGenerator.forBlock['math_map'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        const fromLow = javascriptGenerator.valueToCode(block, 'FROM_LOW', Order.ATOMIC) || '0';
        const fromHigh = javascriptGenerator.valueToCode(block, 'FROM_HIGH', Order.ATOMIC) || '1024';
        const toLow = javascriptGenerator.valueToCode(block, 'TO_LOW', Order.ATOMIC) || '0';
        const toHigh = javascriptGenerator.valueToCode(block, 'TO_HIGH', Order.ATOMIC) || '255';

        // Função map estilo Arduino
        const code = `((${value} - ${fromLow}) * (${toHigh} - ${toLow}) / (${fromHigh} - ${fromLow}) + ${toLow})`;
        return [code, Order.ATOMIC];
    };

    // Bloco de ângulo (field_angle) — usado como shadow no servo do palco
    javascriptGenerator.forBlock['math_angle'] = function (block: Blockly.Block) {
        const num = Number(block.getFieldValue('NUM')) || 0;
        return [String(num), Order.ATOMIC];
    };

    javascriptGenerator.forBlock['board_angle_stage'] = function (block: Blockly.Block) {
        const num = Number(block.getFieldValue('NUM')) || 0;
        return [String(num), Order.ATOMIC];
    };
};
