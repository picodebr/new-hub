/**
 * Tradução para C++ dos blocos de E/S Digital, Analógica e PWM.
 */
import * as Blockly from 'blockly';
import { arduinoGenerator } from './generator';

// =================================================================
// 3. BLOCOS DE HARDWARE (Saída)
// =================================================================

// DEFINIR PINO DIGITAL
arduinoGenerator.forBlock["set_digital_pin_pt"] = function (block: Blockly.Block) {
    const pin = block.getFieldValue("PIN");
    const state = block.getFieldValue("STATE");

    arduinoGenerator.definitions_['setup_pin_' + pin] = `pinMode(${pin}, OUTPUT);`;
    return `digitalWrite(${pin}, ${state});\n`;
};

// DEFINIR PINO PWM
arduinoGenerator.forBlock["set_pwm_pin_pt"] = function (block: Blockly.Block) {
    const pin = block.getFieldValue("PIN");
    // const value = arduinoGenerator.valueToCode(block, "VALUE", arduinoGenerator.ORDER_ATOMIC) || "0";
    // NOTA: No código original 'value' era shadowNum(255) na def de categoria, então deve ser valueToCode.
    // No entanto, notei em toolbox.ts que usei .withShadowValue('VALUE', shadowNum(255))
    // Então valueToCode está correto.
    const value = arduinoGenerator.valueToCode(block, "VALUE", arduinoGenerator.ORDER_ATOMIC) || "0";

    arduinoGenerator.definitions_['setup_pin_' + pin] = `pinMode(${pin}, OUTPUT);`;
    return `analogWrite(${pin}, ${value});\n`;
};

// =================================================================
// 7. ENTRADA & SENSORES (Extendido) - Moved Pullup here as per plan? 
// No plan I said create io.ts for digital/analog/pwm write AND move board_set_pullup here.
// =================================================================

arduinoGenerator.forBlock["board_set_pullup"] = function (block: Blockly.Block) {
    const pin = block.getFieldValue("PIN");
    arduinoGenerator.definitions_['setup_pin_' + pin] = `pinMode(${pin}, INPUT_PULLUP);`;
    return "";
};
