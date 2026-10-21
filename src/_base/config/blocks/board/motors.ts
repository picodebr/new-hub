/**
 * Definições de blocos para Motores e Movimentação no modo Board.
 */
export const blockMotors = [
    {
        "type": "motor_control",
        "message0": "Acionar motor %1 no sentido %2",
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
                    ["↻ ", "HORARIO"],
                    ["↺", "ANTIHORARIO"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#4C97FF",
        "tooltip": "Gira o objeto"
    },
    {
        "type": "motor_control_pwm",
        "message0": "Acionar motor %1 no sentido %2 com velocidade %3",
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
                    ["↻ ", "HORARIO"],
                    ["↺", "ANTIHORARIO"]
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
        "colour": "#4C97FF",
        "tooltip": "Gira o objeto"
    },
    {
        "type": "motor_stop_ab",
        "message0": "Desligar motor %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "MOTOR",
                "options": [
                    ["A", "MOTOR_A"],
                    ["B", "MOTOR_B"],
                    ["A e B", "MOTOR_AB"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#4C97FF",
        "tooltip": "Para o motor selecionado imediatamente"
    }
];
