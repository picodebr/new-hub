/**
 * Tradução para C++ dos blocos de Sensores (Ultrassônico, LDR, Botão).
 */
import * as Blockly from 'blockly';
import { arduinoGenerator } from './generator';

// =================================================================
// 4. SENSORES & ENTRADA
// =================================================================

// LER PINO DIGITAL
arduinoGenerator.forBlock["board_read_digital_pin"] = function (block: Blockly.Block) {
    const pin = block.getFieldValue("PIN");
    arduinoGenerator.definitions_['setup_pin_' + pin] = `pinMode(${pin}, INPUT);`;
    const code = `digitalRead(${pin})`;
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

// LER PINO ANALÓGICO
arduinoGenerator.forBlock["board_read_analog_pin"] = function (block: Blockly.Block) {
    const pin = block.getFieldValue("PIN");
    const code = `analogRead(${pin})`;
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

// SENSOR ULTRASSÔNICO
arduinoGenerator.forBlock["board_ultrasonic_read"] = function (block: Blockly.Block) {
    const trig = block.getFieldValue("TRIG");
    const echo = block.getFieldValue("ECHO");

    // Verifica se trig/echo são apenas números ou expressões completas? Geralmente Dropdowns ou entradas de texto.
    // Assumimos que são números/IDs de pinos.

    arduinoGenerator.definitions_['func_get_distance'] = `
long get_distance(int trig, int echo) {
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long duration = pulseIn(echo, HIGH);
  return duration * 0.034 / 2;
}`;
    const code = `get_distance(${trig}, ${echo})`;
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock["board_ldr_read"] = function (_block: Blockly.Block) {
    // A5 fixo para LDR conforme configuração anterior ou definição de bloco?
    // Toolbox tooltip diz "A5".
    // Além disso, a definição não tem campo PIN.
    const pin = "A5";
    return [`analogRead(${pin})`, arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock["board_button_read"] = function (_block: Blockly.Block) {
    // PIN 2 fixo conforme tooltip
    const pin = "2";
    arduinoGenerator.definitions_['setup_pin_' + pin] = `pinMode(${pin}, INPUT);`;
    // Retorna boolean true (HIGH) se pressionado?
    // Geralmente os botões são LOW ativos se for pullup, ou HIGH se for pulldown.
    // Assumindo alto ativo padrão por enquanto ou módulo de botão.
    return [`(digitalRead(${pin}) == LOW)`, arduinoGenerator.ORDER_ATOMIC];
};
