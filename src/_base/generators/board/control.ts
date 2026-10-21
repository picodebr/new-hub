/**
 * Tradução para C++ dos blocos de controle de fluxo (if, for, while, delay).
 */
import * as Blockly from 'blockly';
import { arduinoGenerator } from './generator';

// =================================================================
// 5. CONTROLE & LÓGICA
// =================================================================

// ESPERAR
arduinoGenerator.forBlock["wait_block"] = function (block: Blockly.Block) {
    const time = arduinoGenerator.valueToCode(block, "TIME", arduinoGenerator.ORDER_ATOMIC) || "1000";
    return `delay(${time});\n`;
};

// SE
arduinoGenerator.forBlock["if_block"] = function (block: Blockly.Block) {
    const condition = arduinoGenerator.valueToCode(block, "CONDITION", arduinoGenerator.ORDER_ATOMIC) || "false";
    const statements = arduinoGenerator.statementToCode(block, "DO");
    return `if (${condition}) {\n${statements}  }\n`;
};

// SE SENÃO
arduinoGenerator.forBlock["if_else_block"] = function (block: Blockly.Block) {
    const condition = arduinoGenerator.valueToCode(block, "CONDITION", arduinoGenerator.ORDER_ATOMIC) || "false";
    const doCode = arduinoGenerator.statementToCode(block, "DO");
    const elseCode = arduinoGenerator.statementToCode(block, "ELSE");
    return `if (${condition}) {\n${doCode}  } else {\n${elseCode}  }\n`;
};

// REPETIR
arduinoGenerator.forBlock["repeat_block"] = function (block: Blockly.Block) {
    const times = arduinoGenerator.valueToCode(block, "TIMES", arduinoGenerator.ORDER_ATOMIC) || "10";
    const statements = arduinoGenerator.statementToCode(block, "DO");
    return `for (int i = 0; i < ${times}; i++) {\n${statements}  }\n`;
};

// ENQUANTO
arduinoGenerator.forBlock["while_block"] = function (block: Blockly.Block) {
    const condition = arduinoGenerator.valueToCode(block, "CONDITION", arduinoGenerator.ORDER_ATOMIC) || "false";
    const statements = arduinoGenerator.statementToCode(block, "DO");
    return `while (${condition}) {\n${statements}  }\n`;
};

// PARA SEMPRE
arduinoGenerator.forBlock["forever_block"] = function (block: Blockly.Block) {
    const statements = arduinoGenerator.statementToCode(block, "DO");
    return `while (true) {\n${statements}  }\n`;
};
