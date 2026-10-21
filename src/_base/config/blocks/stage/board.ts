/**
 * Definições visuais dos blocos de interação com a Placa no modo Stage.
 */
export const blockBoard = [
    {
        "type": "board_read_digital_pin_stage",
        "message0": "ler pino digital %1",
        "args0": [

            {
                "type": "field_dropdown",
                "name": "PIN",
                "options": [
                    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"],
                    ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
                ]
            }
        ],
        "output": "Number",
        "colour": "#00C896",
        "tooltip": "Lê se o pino está LIGADO (High) ou DESLIGADO (Low)"
    },
    {
        "type": "board_read_analog_pin_stage",
        "message0": "ler pino analógico %1",
        "args0": [

            {
                "type": "field_dropdown",
                "name": "PIN",
                "options": [
                    ["A0", "0"], ["A1", "1"], ["A2", "2"], ["A3", "3"], ["A4", "4"], ["A5", "5"], ["A6", "6"], ["A7", "7"]
                ]
            }
        ],
        "output": "Number",
        "colour": "#00C896",
        "tooltip": "Lê um valor entre 0 e 1023 da porta analógica"
    }, {
        "type": "board_button_read_stage",
        "message0": "botão da placa pressionado",
        "output": "Boolean",
        "colour": "#00C896",
        "tooltip": "Retorna VERDADEIRO se o botão no pino 2 for pressionado",
        "helpUrl": ""
    },
    {
        "type": "board_angle_stage",
        "message0": "%1",
        "args0": [
            {
                "type": "field_angle",
                "name": "NUM",
                "value": 90,
                "max": 180,
                "min": 0
            }
        ],
        "output": "Number",
        "colour": "#00C896",
        "tooltip": "Um ângulo selecionado (0-180)",
        "helpUrl": ""
    },
    {
        "type": "board_ultrasonic_read_stage",
        "message0": "distância ultrassônico trig %1 eco %2 em %3",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "TRIG",
                "options": [
                    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"],
                    ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],
                    ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "ECHO",
                "options": [
                    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"],
                    ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],
                    ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "UNIT",
                "options": [["cm", "CM"], ["pol", "IN"]]
            }
        ],
        "output": "Number",
        "colour": "#00C896",
        "tooltip": "Lê a distância do HC-SR04 via Firmata (Sysex 0x62). Requer firmware PingFirmata.",
        "helpUrl": ""
    },
    {
        "type": "board_traffic_light_stage",
        "message0": "definir %1 como %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "COLOR",
                "options": [
                    ["🔴", "VERMELHO"],
                    ["🟡", "AMARELO"],
                    ["🟢", "VERDE"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "STATE",
                "options": [
                    ["ligado", "HIGH"],
                    ["desligado", "LOW"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#00C896",
        "tooltip": "Controla o semáforo: vermelho=pino 13, amarelo=pino 12, verde=pino 4",
        "helpUrl": ""
    },
    {
        "type": "board_set_pin_stage",
        "message0": "definir pino %1 como %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "PIN",
                "options": [
                    ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
                    ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"],
                    ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"], ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"], ["A6", "A6"], ["A7", "A7"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "STATE",
                "options": [
                    ["ligado", "HIGH"],
                    ["desligado", "LOW"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#00C896",
        "tooltip": "Ativa ou desativa um pino digital (1 a 13) via Firmata",
        "helpUrl": ""
    },
    {
        "type": "board_servo_move_stage",
        "message0": "mover servo no pino %1 para %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "PIN",
                "options": [
                    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"],
                    ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"],
                    ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"]
                ]
            },
            {
                "type": "input_value",
                "name": "DEGREE",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#00C896",
        "tooltip": "Move o servo motor para o ângulo especificado (0-180)",
        "helpUrl": ""
    },
    {
        "type": "motor_control_stage",
        "message0": "acionar motor %1 no sentido %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "MOTOR",
                "options": [
                    ["A", "MOTOR_A"],
                    ["B", "MOTOR_B"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "DIRECAO",
                "options": [
                    ["↻ horário", "HORARIO"],
                    ["↺ anti-horário", "ANTIHORARIO"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#00C896",
        "tooltip": "Gira o motor A (pinos 5 e 10) ou B (pinos 9 e 6) no sentido escolhido via Firmata"
    },
    {
        "type": "motor_control_pwm_stage",
        "message0": "acionar motor %1 no sentido %2 com velocidade %3",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "MOTOR",
                "options": [
                    ["A", "MOTOR_A"],
                    ["B", "MOTOR_B"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "DIRECAO",
                "options": [
                    ["↻ horário", "HORARIO"],
                    ["↺ anti-horário", "ANTIHORARIO"]
                ]
            },
            {
                "type": "input_value",
                "name": "VELOCIDADE",
                "check": "Number"
            }
        ],
        "inputsInline": true,
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#00C896",
        "tooltip": "Gira o motor com velocidade de 0 a 100 (mapeado para PWM 0-255). Motor A: pinos 9/6, Motor B: pinos 10/5"
    },
    {
        "type": "motor_stop_stage",
        "message0": "parar motor %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "MOTOR",
                "options": [
                    ["A", "MOTOR_A"],
                    ["B", "MOTOR_B"],
                    ["A e B", "MOTOR_ALL"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#00C896",
        "tooltip": "Para o motor desligando os dois pinos de controle (LOW/LOW)"
    }
];
