/**
 * Definições de blocos Matemáticos e Primitivos no modo Board.
 */
export const blockMath = [
    {
        "type": "math_map",
        "message0": "map %1 de ( %2 a %3 ) para ( %4 a %5 )",
        "args0": [
            {
                "type": "input_value",
                "name": "VALUE",
                "check": "Number"
            },
            {
                "type": "input_value",
                "name": "FROM_LOW",
                "check": "Number"
            },
            {
                "type": "input_value",
                "name": "FROM_HIGH",
                "check": "Number"
            },
            {
                "type": "input_value",
                "name": "TO_LOW",
                "check": "Number"
            },
            {
                "type": "input_value",
                "name": "TO_HIGH",
                "check": "Number"
            }
        ],
        "inputsInline": true,
        "output": "Number",
        "colour": "#59C059",
        "tooltip": "Mapeia um valor de um intervalo para outro (ex: de 0-1023 para 0-255).",
        "helpUrl": ""
    },
    {
        "type": "math_number_slider",
        "message0": "%1",
        "args0": [
            {
                "type": "field_slider",
                "name": "NUM",
                "value": 128,
                "min": 0,
                "max": 255
            }
        ],
        "output": "Number",
        "colour": "#4C97FF",
        "tooltip": "Um número selecionado via slider",
        "helpUrl": ""
    },
    {
        "type": "math_angle",
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
        "tooltip": "Um ângulo selecionado (0-360)",
        "helpUrl": ""
    },
    {
        "type": "logic_boolean",
        "message0": "%1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "BOOL",
                "options": [
                    ["verdadeiro", "TRUE"],
                    ["falso", "FALSE"]
                ]
            }
        ],
        "output": "Boolean",
        "colour": "#59C059",
        "tooltip": "Retorna verdadeiro ou falso",
        "helpUrl": ""
    }
];
