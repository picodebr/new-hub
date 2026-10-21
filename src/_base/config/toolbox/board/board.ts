/**
 * Configuração das categorias de hardware (I/O, Sensores, Atuadores) para a toolbox do modo Board.
 * 
 * Nota Técnica: Utiliza shadow blocks (blocos fantasmas) para pré-preencher 
 * campos numéricos e de texto, facilitando o uso rápido pelo usuário.
 */
import { BlockBuilder, CategoryBuilder, shadowNum, shadowText, shadowBlock } from "../../../lib/blockly/BlockBuilder";

const shadowSlider = (val: number) => shadowBlock('math_number_slider', 'NUM', val);

// Categorias de Upload Mode
export const catOutput = new CategoryBuilder("Saída", "#4C97FF");
catOutput.addBlock(new BlockBuilder('set_digital_pin_pt').withField('PIN', '13').withField('STATE', 'HIGH'));
catOutput.addBlock(new BlockBuilder('set_pwm_pin_pt').withField('PIN', '3').withShadowValue('VALUE', shadowNum(255)));
catOutput.addBlock(new BlockBuilder('motor_control').withField('MOTOR', 'MOTOR_A').withField('DIRECAO', 'HORARIO'));
catOutput.addBlock(new BlockBuilder('motor_control_pwm').withField('MOTOR', 'MOTOR_A').withField('DIRECAO', 'HORARIO').withShadowValue('VELOCIDADE', shadowSlider(128)));
catOutput.addBlock(new BlockBuilder('motor_stop_ab'));

export const catInput = new CategoryBuilder("Entrada", "#9966FF");
catInput.addBlock(new BlockBuilder('board_read_digital_pin').withField('PIN', '2'));
catInput.addBlock(new BlockBuilder('board_read_analog_pin').withField('PIN', 'A0'));
catInput.addBlock(new BlockBuilder('board_set_pullup').withField('PIN', '2'));

export const catSensorsBoard = new CategoryBuilder("Sensores", "#00e5ff");
catSensorsBoard.addBlock(new BlockBuilder('board_ultrasonic_read').withField('TRIG', '2').withField('ECHO', '3').withField('UNIT', 'CM'));
catSensorsBoard.addBlock(new BlockBuilder('board_ldr_read'));
catSensorsBoard.addBlock(new BlockBuilder('board_button_read'));

export const catSerial = new CategoryBuilder("Serial", "#D35400");
catSerial.addBlock(new BlockBuilder('board_serial_print').withShadowValue('CONTENT', shadowText('Olá')));

export const catActuators = new CategoryBuilder("Atuadores", "#FF6680");
catActuators.addBlock(new BlockBuilder('board_servo_move').withField('PIN', '9').withShadowValue('DEGREE', shadowBlock('math_angle', 'NUM', 90)));
catActuators.addBlock(new BlockBuilder('board_play_note').withField('PIN', '8').withField('NOTE', '262').withShadowValue('DURATION', shadowNum(500)));
catActuators.addBlock(new BlockBuilder('play_tone_block').withField('PIN', '8').withShadowValue('FREQUENCY', shadowNum(262)).withShadowValue('DURATION', shadowNum(500)));
