/**
 * Tradução para C++ dos blocos do kit Artbot, utilizando a biblioteca Otto.h.
 */
import * as Blockly from 'blockly';
import { arduinoGenerator } from './generator';

// Configuração de Hardware Fixa (Otto DIY / Artbot)
const BUZZER = 13;
const LEFT_LEG = 2;
const RIGHT_LEG = 3;
const LEFT_FOOT = 4;
const RIGHT_FOOT = 5;
const TRIGGER = 8;
const ECHO = 9;
// =================================================================
// ARTBOT UPLOAD — Ação de movimento simples
// =================================================================
arduinoGenerator.forBlock["artbot_move"] = function (block: Blockly.Block) {
    const direction = block.getFieldValue('DIR') || 'FORWARD';
    const steps = arduinoGenerator.valueToCode(block, 'STEPS', arduinoGenerator.ORDER_ATOMIC) || '1';

    // Definições globais (macros e instâncias)
    arduinoGenerator.definitions_['include_otto'] = '#include <Otto.h>';
    arduinoGenerator.definitions_['var_otto'] = 'Otto Otto;';

    // Mapeamento de pinos (macros estilo Otto DIY)
    arduinoGenerator.definitions_['define_left_leg'] = `#define LeftLeg ${LEFT_LEG}`;
    arduinoGenerator.definitions_['define_right_leg'] = `#define RightLeg ${RIGHT_LEG}`;
    arduinoGenerator.definitions_['define_left_foot'] = `#define LeftFoot ${LEFT_FOOT}`;
    arduinoGenerator.definitions_['define_right_foot'] = `#define RightFoot ${RIGHT_FOOT}`;
    arduinoGenerator.definitions_['define_buzzer'] = `#define Buzzer ${BUZZER}`;

    // Setup unificado
    arduinoGenerator.definitions_['setup_otto_init'] = 'delay(2000);\nOtto.init(LeftLeg, RightLeg, LeftFoot, RightFoot, true, Buzzer);';


    const dirVal = direction === 'FORWARD' ? '1' : '-1';
    return `Otto.walk(${steps}, 1000, ${dirVal});\ndelay(500);\n`;
};

// =================================================================
// ARTBOT UPLOAD — Virar
// =================================================================
arduinoGenerator.forBlock["artbot_turn"] = function (block: Blockly.Block) {
    const direction = block.getFieldValue('DIR') || 'LEFT';
    const steps = arduinoGenerator.valueToCode(block, 'STEPS', arduinoGenerator.ORDER_ATOMIC) || '1';

    // Definições globais
    arduinoGenerator.definitions_['include_otto'] = '#include <Otto.h>';
    arduinoGenerator.definitions_['var_otto'] = 'Otto Otto;';

    arduinoGenerator.definitions_['define_left_leg'] = `#define LeftLeg ${LEFT_LEG}`;
    arduinoGenerator.definitions_['define_right_leg'] = `#define RightLeg ${RIGHT_LEG}`;
    arduinoGenerator.definitions_['define_left_foot'] = `#define LeftFoot ${LEFT_FOOT}`;
    arduinoGenerator.definitions_['define_right_foot'] = `#define RightFoot ${RIGHT_FOOT}`;
    arduinoGenerator.definitions_['define_buzzer'] = `#define Buzzer ${BUZZER}`;

    arduinoGenerator.definitions_['setup_otto_init'] = 'delay(2000);\nOtto.init(LeftLeg, RightLeg, LeftFoot, RightFoot, true, Buzzer);';


    const dirVal = (direction === 'LEFT' || direction.startsWith('LEFT')) ? '1' : '-1';
    return `Otto.turn(${steps}, 1000, ${dirVal});\ndelay(500);\n`;
};

// =================================================================
// ARTBOT UPLOAD — Ações Físicas (Sentar / Levantar / Dançar)
// =================================================================
arduinoGenerator.forBlock["artbot_action"] = function (block: Blockly.Block) {
    const action = block.getFieldValue('ACTION') || 'SIT';

    // Definições globais
    arduinoGenerator.definitions_['include_otto'] = '#include <Otto.h>';
    arduinoGenerator.definitions_['var_otto'] = 'Otto Otto;';
    arduinoGenerator.definitions_['define_left_leg'] = `#define LeftLeg ${LEFT_LEG}`;
    arduinoGenerator.definitions_['define_right_leg'] = `#define RightLeg ${RIGHT_LEG}`;
    arduinoGenerator.definitions_['define_left_foot'] = `#define LeftFoot ${LEFT_FOOT}`;
    arduinoGenerator.definitions_['define_right_foot'] = `#define RightFoot ${RIGHT_FOOT}`;
    arduinoGenerator.definitions_['define_buzzer'] = `#define Buzzer ${BUZZER}`;

    arduinoGenerator.definitions_['setup_otto_init'] = 'delay(2000);\nOtto.init(LeftLeg, RightLeg, LeftFoot, RightFoot, true, Buzzer);';

    let code = '';
    if (action === 'SIT') {
        code += 'for (int grau = 0; grau <= 90; grau++) {\n';
        code += '  Otto._moveSingle(90 - grau, 2);\n';
        code += '  Otto._moveSingle(90 + grau, 3);\n';
        code += '  delay(20);\n';
        code += '}\n';
    } else if (action === 'STANDUP') {
        // O usuário forneceu o loop de retorno (standup) na segunda parte do snippet
        code += 'for (int grau = 0; grau <= 90; grau++) {\n';
        code += '  Otto._moveSingle(grau, 2);\n';
        code += '  Otto._moveSingle(180 - grau, 3);\n';
        code += '  delay(20);\n';
        code += '}\n';
    } else if (action === 'BALANCE') {
        code += 'Otto.shakeLeg(2, 1500, 1);\n';
    }

    code += 'delay(500);\n';

    return code;
};

// =================================================================
// ARTBOT UPLOAD — Cantar
// =================================================================
arduinoGenerator.forBlock["artbot_sing"] = function (block: Blockly.Block) {
    const song = block.getFieldValue('SONG') || 'S_happy';

    // Definições globais
    arduinoGenerator.definitions_['include_otto'] = '#include <Otto.h>';
    arduinoGenerator.definitions_['var_otto'] = 'Otto Otto;';
    arduinoGenerator.definitions_['define_left_leg'] = `#define LeftLeg ${LEFT_LEG}`;
    arduinoGenerator.definitions_['define_right_leg'] = `#define RightLeg ${RIGHT_LEG}`;
    arduinoGenerator.definitions_['define_left_foot'] = `#define LeftFoot ${LEFT_FOOT}`;
    arduinoGenerator.definitions_['define_right_foot'] = `#define RightFoot ${RIGHT_FOOT}`;
    arduinoGenerator.definitions_['define_buzzer'] = `#define Buzzer ${BUZZER}`;
    if (song === 'SONG_BIRTHDAY') {
        arduinoGenerator.definitions_['note_defines'] = `
#define NOTE_C4  262
#define NOTE_D4  294
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_G4  392
#define NOTE_A4  440
#define NOTE_AS4 466
#define NOTE_C5  523
#define REST      0`;

        let code = '{\n';
        code += '  int melody[] = { NOTE_C4,4, NOTE_C4,8, NOTE_D4,-4, NOTE_C4,-4, NOTE_F4,-4, NOTE_E4,-2, NOTE_C4,4, NOTE_C4,8, NOTE_D4,-4, NOTE_C4,-4, NOTE_G4,-4, NOTE_F4,-2, NOTE_C4,4, NOTE_C4,8, NOTE_C5,-4, NOTE_A4,-4, NOTE_F4,-4, NOTE_E4,-4, NOTE_D4,-4, NOTE_AS4,4, NOTE_AS4,8, NOTE_A4,-4, NOTE_F4,-4, NOTE_G4,-4, NOTE_F4,-2 };\n';
        code += '  int notes = sizeof(melody) / sizeof(melody[0]) / 2;\n';
        code += '  int wholenote = (60000 * 4) / 140;\n';
        code += '  int divider = 0, noteDuration = 0;\n';
        code += '  for (int thisNote = 0; thisNote < notes * 2; thisNote = thisNote + 2) {\n';
        code += '    divider = melody[thisNote + 1];\n';
        code += '    if (divider > 0) noteDuration = (wholenote) / divider;\n';
        code += '    else if (divider < 0) noteDuration = (wholenote) / abs(divider) * 1.5;\n';
        code += '    tone(Buzzer, melody[thisNote], noteDuration * 0.9);\n';
        code += '    delay(noteDuration);\n';
        code += '    noTone(Buzzer);\n';
        code += '  }\n';
        code += '}\n';
        return code;
    }

    return `Otto.sing(${song});\n`;
};

// =================================================================
// ARTBOT UPLOAD — Posição Inicial
// =================================================================
arduinoGenerator.forBlock["artbot_home"] = function (_block: Blockly.Block) {
    // Definições globais
    arduinoGenerator.definitions_['include_otto'] = '#include <Otto.h>';
    arduinoGenerator.definitions_['var_otto'] = 'Otto Otto;';
    arduinoGenerator.definitions_['define_left_leg'] = `#define LeftLeg ${LEFT_LEG}`;
    arduinoGenerator.definitions_['define_right_leg'] = `#define RightLeg ${RIGHT_LEG}`;
    arduinoGenerator.definitions_['define_left_foot'] = `#define LeftFoot ${LEFT_FOOT}`;
    arduinoGenerator.definitions_['define_right_foot'] = `#define RightFoot ${RIGHT_FOOT}`;
    arduinoGenerator.definitions_['define_buzzer'] = `#define Buzzer ${BUZZER}`;

    arduinoGenerator.definitions_['setup_otto_init'] = 'delay(2000);\nOtto.init(LeftLeg, RightLeg, LeftFoot, RightFoot, true, Buzzer);';


    return `Otto.home();\n`;
};

arduinoGenerator.forBlock["artbot_dance"] = function (block: Blockly.Block) {
    const dance = block.getFieldValue('DANCE') || 'BALLET';

    // Definições globais
    arduinoGenerator.definitions_['include_otto'] = '#include <Otto.h>';
    arduinoGenerator.definitions_['var_otto'] = 'Otto Otto;';
    arduinoGenerator.definitions_['define_left_leg'] = `#define LeftLeg ${LEFT_LEG}`;
    arduinoGenerator.definitions_['define_right_leg'] = `#define RightLeg ${RIGHT_LEG}`;
    arduinoGenerator.definitions_['define_left_foot'] = `#define LeftFoot ${LEFT_FOOT}`;
    arduinoGenerator.definitions_['define_right_foot'] = `#define RightFoot ${RIGHT_FOOT}`;
    arduinoGenerator.definitions_['define_buzzer'] = `#define Buzzer ${BUZZER}`;

    arduinoGenerator.definitions_['setup_otto_init'] = 'delay(2000);\nOtto.init(LeftLeg, RightLeg, LeftFoot, RightFoot, true, Buzzer);';

    let code = '';
    if (dance === 'BALLET') {
        code += 'Otto.updown(2, 1500, 20);\n';
        code += 'Otto.swing(2, 1000, 20);'
    } else if (dance === 'MOONWALKER_LEFT') {
        code += 'Otto.moonwalker(3, 1000, 25, 1);\n';
    } else if (dance === 'MOONWALKER_RIGHT') {
        code += 'Otto.moonwalker(3, 1000, 25, -1);'
    } else if (dance === 'CROSSSTEP_LEFT') {
        code += 'Otto.crusaito(2, 1000, 20, 1);\n';
    } else if (dance === 'CROSSSTEP_RIGHT') {
        code += 'Otto.crusaito(2, 1000, 20, -1);'
    }

    code += 'delay(500);\n';

    return code;
};

// =================================================================
// ARTBOT UPLOAD — Sensor Ultrassônico (Booleano para Crianças)
// =================================================================
arduinoGenerator.forBlock["artbot_is_obstacle"] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP') || 'LT';
    const distanceThreshold = arduinoGenerator.valueToCode(block, 'DISTANCE', arduinoGenerator.ORDER_ATOMIC) || '15';

    let opSymbol = '<';
    if (operator === 'LTE') opSymbol = '<=';
    else if (operator === 'EQ') opSymbol = '==';
    else if (operator === 'GT') opSymbol = '>';
    else if (operator === 'GTE') opSymbol = '>=';

    // Definições globais
    arduinoGenerator.definitions_['include_otto'] = '#include <Otto.h>';
    arduinoGenerator.definitions_['var_otto'] = 'Otto Otto;';
    arduinoGenerator.definitions_['define_left_leg'] = `#define LeftLeg ${LEFT_LEG}`;
    arduinoGenerator.definitions_['define_right_leg'] = `#define RightLeg ${RIGHT_LEG}`;
    arduinoGenerator.definitions_['define_left_foot'] = `#define LeftFoot ${LEFT_FOOT}`;
    arduinoGenerator.definitions_['define_right_foot'] = `#define RightFoot ${RIGHT_FOOT}`;
    arduinoGenerator.definitions_['define_buzzer'] = `#define Buzzer ${BUZZER}`;
    arduinoGenerator.definitions_['define_trig'] = `#define Trigger ${TRIGGER}`;
    arduinoGenerator.definitions_['define_echo'] = `#define Echo ${ECHO}`;

    // Definição da função de distância customizada (visto que Otto.h pode não ter getDistance)
    arduinoGenerator.definitions_['func_otto_get_distance'] = `
float otto_get_distance() {
  digitalWrite(Trigger, LOW);
  delayMicroseconds(2);
  digitalWrite(Trigger, HIGH);
  delayMicroseconds(10);
  digitalWrite(Trigger, LOW);
  long duration = pulseIn(Echo, HIGH);
  return duration * 0.034 / 2;
}`;

    arduinoGenerator.definitions_['setup_otto_init'] = 'delay(3000);\nOtto.init(LeftLeg, RightLeg, LeftFoot, RightFoot, true, Buzzer);';
    arduinoGenerator.definitions_['setup_ultrasonic'] = `pinMode(Trigger, OUTPUT); pinMode(Echo, INPUT);`;

    const code = `(otto_get_distance() ${opSymbol} ${distanceThreshold})`;
    return [code, arduinoGenerator.ORDER_ATOMIC];
};