/**
 * Definições de blocos de Controle e Fluxo no modo Board.
 */
export const blockControl = [
    {
        "type": "wait_block",
        "message0": "espere %1 ms",
        "args0": [
            {
                "type": "input_value",
                "name": "TIME",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "inputsInline": true,
        "colour": "#FFBF00",
        "tooltip": "Espera o tempo definido em milissegundos",
        "helpUrl": ""
    },
    {
        "type": "if_block",
        "message0": "se %1 então",
        "args0": [
            {
                "type": "input_value",
                "name": "CONDITION",
                "check": "Boolean"
            }
        ],
        "message1": "faça %1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Executa comandos se a condição for verdadeira",
        "helpUrl": ""
    },
    {
        "type": "if_else_block",
        "message0": "se %1 então",
        "args0": [
            {
                "type": "input_value",
                "name": "CONDITION",
                "check": "Boolean"
            }
        ],
        "message1": "faça %1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "message2": "senão %1",
        "args2": [
            {
                "type": "input_statement",
                "name": "ELSE"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Executa comandos se a condição for verdadeira ou outra ação caso contrário",
        "helpUrl": ""
    },
    {
        "type": "repeat_block",
        "message0": "repita %1 vezes",
        "args0": [
            {
                "type": "input_value",
                "name": "TIMES",
                "check": "Number"
            }
        ],
        "message1": "faça %1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "inputsInline": true,
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Repete os comandos o número de vezes definido",
        "helpUrl": ""
    },
    {
        "type": "while_block",
        "message0": "enquanto %1",
        "args0": [
            {
                "type": "input_value",
                "name": "CONDITION",
                "check": "Boolean"
            }
        ],
        "message1": "faça %1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Repete os comandos enquanto a condição for verdadeira",
        "helpUrl": ""
    },
    {
        "type": "forever_block",
        "message0": "para sempre",
        "message1": "faça %1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "previousStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Executa os comandos em um loop infinito",
        "helpUrl": ""
    }
];
