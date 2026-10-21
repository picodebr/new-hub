/**
 * Definições de blocos de E/S Digital e Analógica no modo Board.
 */
export const blockIO = [
    {
        "type": "set_digital_pin_pt",
        "message0": "coloque o pino %1 em nível %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "PIN",
                "options": [
                    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"],
                    ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"],
                    ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"], ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "STATE",
                "options": [
                    ["alto", "HIGH"],
                    ["baixo", "LOW"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#4C97FF",
        "tooltip": "Define o pino digital como nível alto ou baixo",
        "helpUrl": ""
    },
    {
        "type": "set_pwm_pin_pt",
        "message0": "coloque o pino %1 em %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "PIN",
                "options": [
                    ["3", "3"], ["5", "5"], ["6", "6"],
                    ["9", "9"], ["10", "10"], ["11", "11"]
                ]
            },
            {
                "type": "input_value",
                "name": "VALUE",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#4C97FF",
        "tooltip": "Define um valor PWM no pino selecionado",
        "helpUrl": ""
    },
    {
        "type": "board_read_digital_pin",
        "message0": "leitura digital no pino %1",
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
            }
        ],
        "output": "Number",
        "colour": "#9966FF",
        "tooltip": "Lê o estado do pino digital (HIGH/LOW)",
        "helpUrl": ""
    },
    {
        "type": "board_read_analog_pin",
        "message0": "leitura analógica no pino %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "PIN",
                "options": [
                    ["A0", "0"], ["A1", "1"], ["A2", "2"], ["A3", "3"], ["A4", "4"], ["A5", "5"],["A6", "6"], ["A7", "7"]
                ]
            }
        ],
        "output": "Number",
        "colour": "#9966FF",
        "tooltip": "Lê o valor analógico do pino (0-1023)",
        "helpUrl": ""
    },
    {
        "type": "board_set_pullup",
        "message0": "ligar pullup no pino %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "PIN",
                "options": [
                    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"],
                    ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"],
                    ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"], ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Ativa o resistor de pullup interno",
        "helpUrl": ""
    }
];
