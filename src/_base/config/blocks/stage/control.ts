/**
 * Definições visuais dos blocos de Controle (Control) para o modo Stage.
 */
export const blockControl = [
    {
        "type": "repete_vezes",
        "message0": "repete %1 vezes",
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
        "previousStatement": true,
        "nextStatement": true,
        "inputsInline": true,
        "colour": "#FFAB19",
        "tooltip": "Repete os blocos internos um número específico de vezes."
    },
    {
        "type": "repete_sempre",
        "message0": "para sempre",
        "message1": "faça %1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "previousStatement": true,
        "colour": "#FFAB19",
        "tooltip": "Executa os blocos internos em um loop infinito."
    },
    {
        "type": "se_entao",
        "message0": "se %1 então",
        "args0": [
            {
                "type": "input_value",
                "name": "IF0",
                "check": "Boolean"
            }
        ],
        "message1": "faça %1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO0"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FFAB19",
        "tooltip": "Executa os blocos internos APENAS SE a condição for verdadeira."
    },
    {
        "type": "se_entao_senao",
        "message0": "se %1 então",
        "args0": [
            {
                "type": "input_value",
                "name": "IF0",
                "check": "Boolean"
            }
        ],
        "message1": "faça %1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO0"
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
        "colour": "#FFAB19",
        "tooltip": "Executa os primeiros blocos se a condição for verdadeira; caso contrário, executa os segundos blocos."
    },
    {
        "type": "control_wait",
        "message0": "esperar %1 s",
        "args0": [
            {
                "type": "input_value",
                "name": "DURATION",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "inputsInline": true,
        "colour": "#FFAB19",
        "tooltip": "Pausa o programa em segundos."
    },
    {
        "type": "control_start_as_clone",
        "message0": "quando eu começar como um clone",
        "args0": [],
        "extensions": ["force_hat"],
        "nextStatement": true,
        "colour": "#FFAB19",
        "tooltip": "Executa o script quando este objeto for criado como um clone."
    },
    {
        "type": "control_create_clone_of",
        "message0": "crie um clone de %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "CLONE_OPTION",
                "options": [
                    ["este ator", "myself"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FFAB19",
        "tooltip": "Cria uma cópia deste ator."
    },
    {
        "type": "control_delete_this_clone",
        "message0": "apague este clone",
        "args0": [],
        "previousStatement": true,
        "colour": "#FFAB19",
        "tooltip": "Remove este clone da cena."
    },
    {
        "type": "control_wait_until",
        "message0": "espere até que %1",
        "args0": [
            {
                "type": "input_value",
                "name": "CONDITION",
                "check": "Boolean"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FFAB19",
        "tooltip": "Pausa o script até que a condição seja verdadeira."
    },
    {
        "type": "control_repeat_until",
        "message0": "repita até que %1",
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
        "colour": "#FFAB19",
        "tooltip": "Repete os blocos internos até que a condição seja verdadeira."
    },
    {
        "type": "control_for_each",
        "message0": "para cada %1 em %2",
        "args0": [
            {
                "type": "field_variable",
                "name": "VAR",
                "variable": ""
            },
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
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
        "inputsInline": true,
        "colour": "#FFAB19",
        "tooltip": "Executa os blocos internos para cada item da lista, armazenando o item na variável."
    },
    {
        "type": "control_stop",
        "message0": "pare %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "STOP_OPTION",
                "options": [
                    ["tudo", "all"],
                    ["este script", "this script"],
                    ["outros scripts do ator", "other scripts in sprite"]
                ]
            }
        ],
        "previousStatement": true,
        "colour": "#FFAB19",
        "tooltip": "Para a execução de scripts conforme a opção selecionada."
    }
];

