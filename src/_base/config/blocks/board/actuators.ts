/**
 * Definições de blocos para Atuadores (LCD, Servo, LED) no modo Board.
 */
export const blockActuators = [
    {
        "type": "play_tone_block",
        "message0": "tocar pino %1 com frequência de %2 Hz por %3 ms",
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
                "name": "FREQUENCY",
                "check": "Number"
            },
            {
                "type": "input_value",
                "name": "DURATION",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FF6680",
        "tooltip": "Toca um tom no pino especificado com frequência e duração definidas",
        "helpUrl": ""
    },
    {
        "type": "board_play_note",
        "message0": "tocar pino %1 com a nota %2 por %3 ms",
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
                "type": "field_dropdown",
                "name": "NOTE",
                "options": [
                    ["C (Dó)", "262"], ["C# (Dó#)", "277"],
                    ["D (Ré)", "294"], ["D# (Ré#)", "311"],
                    ["E (Mi)", "330"],
                    ["F (Fá)", "349"], ["F# (Fá#)", "370"],
                    ["G (Sol)", "392"], ["G# (Sol#)", "415"],
                    ["A (Lá)", "440"], ["A# (Lá#)", "466"],
                    ["B (Si)", "494"]
                ]
            },
            {
                "type": "input_value",
                "name": "DURATION",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FF6680",
        "tooltip": "Toca uma nota musical específica",
        "helpUrl": ""
    },
    {
        "type": "board_servo_move",
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
        "colour": "#FF6680",
        "tooltip": "Move o servo motor para o ângulo especificado (0-180)",
        "helpUrl": ""
    }
];
