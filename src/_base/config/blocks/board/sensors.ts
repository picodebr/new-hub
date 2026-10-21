/**
 * Definições de blocos para Sensores no modo Board.
 */
export const blockSensors = [
    {
        "type": "board_ultrasonic_read",
        "message0": "Ultrassônico com disparo %1 e eco %2 em %3",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "TRIG",
                "options": [
                    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"],
                    ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"],
                    ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "ECHO",
                "options": [
                    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"],
                    ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"],
                    ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "UNIT",
                "options": [["cm", "CM"], ["pol", "IN"]]
            }
        ],
        "output": "Number",
        "colour": "#00e5ff",
        "tooltip": "Lê a distância usando um sensor ultrassônico HC-SR04",
        "helpUrl": ""
    },
    {
        "type": "board_ldr_read",
        "message0": "luminosidade do ldr",
        "output": "Number",
        "colour": "#00e5ff",
        "tooltip": "Lê a luminosidade no pino A5 (0 a 1023)",
        "helpUrl": ""
    },
    {
        "type": "board_button_read",
        "message0": "botão da placa pressionado",
        "output": "Boolean",
        "colour": "#00e5ff",
        "tooltip": "Retorna VERDADEIRO se o botão no pino 2 for pressionado",
        "helpUrl": ""
    }
];
