/**
 * Tradução para C++ dos blocos de Atuadores (Servo, Buzzer).
 */
import * as Blockly from 'blockly';
import { arduinoGenerator } from './generator';

// =================================================================
// 8. ATUADORES 
// =================================================================



arduinoGenerator.forBlock["board_servo_move"] = function (block: Blockly.Block) {
    const pin = block.getFieldValue("PIN");
    const degree = arduinoGenerator.valueToCode(block, "DEGREE", arduinoGenerator.ORDER_ATOMIC) || "90";

    arduinoGenerator.definitions_['include_servo'] = '#include <Servo.h>';
    arduinoGenerator.definitions_['var_servo_' + pin] = `Servo servo_${pin};`;
    arduinoGenerator.definitions_['setup_servo_' + pin] = `servo_${pin}.attach(${pin});`;

    return `servo_${pin}.write(${degree});\n`;
};

arduinoGenerator.forBlock["board_play_note"] = function (block: Blockly.Block) {
    const pin = block.getFieldValue("PIN");
    const note = block.getFieldValue("NOTE"); // Frequência
    const duration = arduinoGenerator.valueToCode(block, "DURATION", arduinoGenerator.ORDER_ATOMIC) || "500";

    arduinoGenerator.definitions_['setup_pin_' + pin] = `pinMode(${pin}, OUTPUT);`;
    return `tone(${pin}, ${note}, ${duration});\n`;
};

arduinoGenerator.forBlock["play_tone_block"] = function (block: Blockly.Block) {
    const pin = block.getFieldValue("PIN");
    const freq = arduinoGenerator.valueToCode(block, "FREQUENCY", arduinoGenerator.ORDER_ATOMIC) || "1000";
    const duration = arduinoGenerator.valueToCode(block, "DURATION", arduinoGenerator.ORDER_ATOMIC) || "500";

    arduinoGenerator.definitions_['setup_pin_' + pin] = `pinMode(${pin}, OUTPUT);`;
    return `tone(${pin}, ${freq}, ${duration});\n`;
};
