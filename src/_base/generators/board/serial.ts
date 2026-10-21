/**
 * Tradução para C++ dos blocos de comunicação Serial.
 */
import * as Blockly from 'blockly';
import { arduinoGenerator } from './generator';

// =================================================================
// 6. SERIAL
// =================================================================
arduinoGenerator.forBlock["board_serial_print"] = function (block: Blockly.Block) {
    const content = arduinoGenerator.valueToCode(block, "CONTENT", arduinoGenerator.ORDER_ATOMIC) || '""';
    arduinoGenerator.definitions_['setup_serial'] = 'Serial.begin(9600);';
    return `Serial.println(String(${content}));\n`;
};
