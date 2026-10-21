/**
 * Tradução para JavaScript dos blocos de interação com a Placa (via Firmata) no modo Stage.
 */
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const initBoardGenerators = () => {
    // BLOCOS DA PLACA (FIRMATA / MODO PALCO)
    // ==================================================

    // Leitura Digital
    javascriptGenerator.forBlock['board_read_digital_pin'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        // Gera chamada síncrona (via Cache do StageBoard)
        // O proxy no sandbox transformou em Promise => precisa de await.
        const code = `(await stage.board.getDigital('${pin}'))`;
        return [code, Order.ATOMIC];
    };

    // Leitura Digital (Versão Stage - legacy nome)
    javascriptGenerator.forBlock['board_read_digital_pin_stage'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const code = `(await stage.board.getDigital('${pin}'))`;
        return [code, Order.ATOMIC];
    };

    // Botão da Placa (Pino 2 - Active Low)
    javascriptGenerator.forBlock['board_button_read_stage'] = function (_block: Blockly.Block) {
        // Se 0 (LOW) -> Pressionado (True)
        // Se 1 (HIGH) -> Solto (False)
        const code = `(await stage.board.setPullup('2'), !(await stage.board.getDigital('2')))`;
        return [code, Order.LOGICAL_NOT];
    };

    // Leitura Analógica
    javascriptGenerator.forBlock['board_read_analog_pin'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const code = `(await stage.board.getAnalog('${pin}'))`;
        return [code, Order.ATOMIC];
    };

    javascriptGenerator.forBlock['board_read_analog_pin_stage'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const code = `(await stage.board.getAnalog('${pin}'))`;
        return [code, Order.ATOMIC];
    };

    // Semáforo: vermelho=13, amarelo=12, verde=4
    javascriptGenerator.forBlock['board_traffic_light_stage'] = function (block: Blockly.Block) {
        const color = block.getFieldValue('COLOR');
        const state = block.getFieldValue('STATE');
        const pinMap: Record<string, string> = { VERMELHO: '13', AMARELO: '12', VERDE: '4' };
        const pin = pinMap[color];
        const val = state === 'HIGH' ? 'true' : 'false';
        return `await stage.board.setDigital('${pin}', ${val});\n`;
    };

    // Escrita Digital — pinos 1-13 com ligado/desligado (stage/Firmata)
    javascriptGenerator.forBlock['board_set_pin_stage'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE');
        const val = state === 'HIGH' ? 'true' : 'false';
        return `await stage.board.setDigital('${pin}', ${val});\n`;
    };

    // Escrita Digital
    javascriptGenerator.forBlock['set_digital_pin_pt'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE'); // "HIGH" or "LOW"
        const val = (state === 'HIGH') ? 'true' : 'false';
        return `await stage.board.setDigital('${pin}', ${val});\n`;
    };

    // Escrita PWM
    javascriptGenerator.forBlock['set_pwm_pin_pt'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await stage.board.setPwm('${pin}', ${value});\n`;
    };

    // Servo
    javascriptGenerator.forBlock['board_servo_move'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const degree = javascriptGenerator.valueToCode(block, 'DEGREE', Order.ATOMIC) || '90';
        return `await stage.board.setServo('${pin}', ${degree});\n`;
    };

    // Servo (versão palco)
    javascriptGenerator.forBlock['board_servo_move_stage'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const degree = javascriptGenerator.valueToCode(block, 'DEGREE', Order.ATOMIC) || '90';
        return `await stage.board.setServo('${pin}', ${degree});\n`;
    };

    // Pullup
    javascriptGenerator.forBlock['board_set_pullup'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        return `await stage.board.setPullup('${pin}');\n`;
    };

    // Ultrassônico — stage (Sysex 0x62 / PingFirmata)
    const ultrasonicGen = function (block: Blockly.Block): [string, number] {
        const trig = block.getFieldValue('TRIG');
        const echo = block.getFieldValue('ECHO');
        const unit = block.getFieldValue('UNIT');
        const raw = `(await stage.board.getUltrasonic('${trig}', '${echo}'))`;
        // cm já vem do cache (duração/58); pol = duração/148 → dividimos o cm por 2.54
        const code = unit === 'IN' ? `(${raw} / 2.54)` : raw;
        return [code, Order.ATOMIC];
    };
    javascriptGenerator.forBlock['board_ultrasonic_read_stage'] = ultrasonicGen;
    // Reutiliza o mesmo generator para o bloco do modo upload (sobrescreve o mock)
    javascriptGenerator.forBlock['board_ultrasonic_read'] = ultrasonicGen;

    // LDR (Simples Analog Read no A5 fixo, conforme tooltip legado)
    javascriptGenerator.forBlock['board_ldr_read'] = function (_block: Blockly.Block) {
        const code = `(await stage.board.getAnalog('A5'))`;
        return [code, Order.ATOMIC];
    };

    // Botão Placa (Pino 2 fixo, conforme tooltip legado)
    javascriptGenerator.forBlock['board_button_read'] = function (_block: Blockly.Block) {
        const code = `(await stage.board.setPullup('2'), await stage.board.getDigital('2'))`;
        return [code, Order.ATOMIC];
    };

    // ── MOTORES (Ponte H / L298N) ──────────────────────────────────────
    // Motor A: pino1=5, pino2=10 | Motor B: pino1=9, pino2=6

    const motorPins: Record<string, [string, string]> = {
        MOTOR_A: ['9', '6'],
        MOTOR_B: ['10', '5'],
    };

    const motorControlGen = function (block: Blockly.Block): string {
        const motor = block.getFieldValue('MOTOR');
        const direcao = block.getFieldValue('DIRECAO');
        const [p1, p2] = motorPins[motor];
        if (direcao === 'HORARIO') {
            return `await stage.board.setDigital('${p1}', true);\nawait stage.board.setDigital('${p2}', false);\n`;
        }
        return `await stage.board.setDigital('${p1}', false);\nawait stage.board.setDigital('${p2}', true);\n`;
    };
    javascriptGenerator.forBlock['motor_control_stage'] = motorControlGen;
    javascriptGenerator.forBlock['motor_control'] = motorControlGen;

    const motorPwmGen = function (block: Blockly.Block): string {
        const motor = block.getFieldValue('MOTOR');
        const direcao = block.getFieldValue('DIRECAO');
        const velocidade = javascriptGenerator.valueToCode(block, 'VELOCIDADE', Order.ATOMIC) || '0';
        const [p1, p2] = motorPins[motor];
        const pwm = `(${velocidade} === 0 ? 0 : Math.round(102 + (${velocidade} / 100) * 153))`;
        if (direcao === 'HORARIO') {
            return `await stage.board.setPwm('${p1}', ${pwm});\nawait stage.board.setDigital('${p2}', false);\n`;
        }
        return `await stage.board.setDigital('${p1}', false);\nawait stage.board.setPwm('${p2}', ${pwm});\n`;
    };
    javascriptGenerator.forBlock['motor_control_pwm_stage'] = motorPwmGen

    javascriptGenerator.forBlock['motor_stop_stage'] = function (block: Blockly.Block): string {
        const motor = block.getFieldValue('MOTOR');
        if (motor === 'MOTOR_ALL') {
            return (
                `await stage.board.setDigital('9', false);\nawait stage.board.setDigital('6', false);\n` +
                `await stage.board.setDigital('10', false);\nawait stage.board.setDigital('5', false);\n`
            );
        }
        const [p1, p2] = motorPins[motor];
        return `await stage.board.setDigital('${p1}', false);\nawait stage.board.setDigital('${p2}', false);\n`;
    };

    // Serial Print (Monitor Serial Virtual)
    javascriptGenerator.forBlock['board_serial_print'] = function (block: Blockly.Block) {
        const content = javascriptGenerator.valueToCode(block, 'CONTENT', Order.ATOMIC) || '""';
        return `console.log("SERIAL OUTPUT:", ${content});\n`;
    };

    // Play Note / Tone (Buzzer) - Implementação básica ou Mock
    // Requereria enviar comando de Tone (não padrão no Firmata Standard, às vezes via Sysex ou I2C backpack).
    // Ou usamos PWM se for piezo simples?
    javascriptGenerator.forBlock['board_play_note'] = function (_block: Blockly.Block) {
        return `console.log("Play Note not implemented in StageBoard yet.");\n`;
    };

    javascriptGenerator.forBlock['play_tone_block'] = function (_block: Blockly.Block) {
        return `console.log("Play Tone not implemented in StageBoard yet.");\n`;
    };
};
