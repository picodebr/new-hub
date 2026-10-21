/**
 * Configuração da categoria 'Placa' (extensão) para o modo Stage.
 */
import { CategoryBuilder, BlockBuilder, shadowBlock } from "../../../lib/blockly/BlockBuilder";

/**
 * Categoria Placa (Stage Mode)
 * 
 * Extensão PiBoard — blocos de leitura/escrita de pinos em tempo real.
 * Usa o mesmo padrão de função do ML para garantir que o ícone seja injetado corretamente.
 */
export const getBoardCategory = () => {
    const cat = new CategoryBuilder("Placa", "#00C896")
        .withIcon('/svg/Piboard-icon.svg')
        .addBlock(new BlockBuilder('board_ultrasonic_read_stage').withField('TRIG', '9').withField('ECHO', '10').withField('UNIT', 'CM'))
        .addBlock(new BlockBuilder('board_traffic_light_stage').withField('COLOR', 'VERMELHO').withField('STATE', 'HIGH'))
        .addBlock(new BlockBuilder('board_set_pin_stage').withField('PIN', '13').withField('STATE', 'HIGH'))
        .addBlock(new BlockBuilder('board_read_digital_pin_stage').withField('PIN', '2'))
        .addBlock(new BlockBuilder('board_read_analog_pin_stage').withField('PIN', '0'))
        .addBlock(new BlockBuilder('board_button_read_stage'))
        .addBlock(new BlockBuilder('board_servo_move_stage').withField('PIN', '9').withShadowValue('DEGREE', shadowBlock('board_angle_stage', 'NUM', 90)))
        .addBlock(new BlockBuilder('motor_control_stage').withField('MOTOR', 'MOTOR_A').withField('DIRECAO', 'HORARIO'))
        .addBlock(new BlockBuilder('motor_control_pwm_stage').withField('MOTOR', 'MOTOR_A').withField('DIRECAO', 'HORARIO').withShadowValue('VELOCIDADE', shadowBlock('math_number', 'NUM', 50)))
        .addBlock(new BlockBuilder('motor_stop_stage').withField('MOTOR', 'MOTOR_A'));

    return cat;
};
