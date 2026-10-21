/**
 * Definições visuais dos blocos de Sensores para o modo Stage.
 * 
 * Responsabilidade: Definir a aparência (cores, mensagens, dropdowns) dos 
 * blocos que permitem ao ator interagir com o ambiente e com o usuário.
 * Traduzido para Português seguindo o padrão Scratch.
 */
export const blockSensing = [
    {
        "type": "sensing_touchingobject",
        "message0": "tocando em %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "TOUCHINGOBJECTMENU",
                "options": [
                    ["ponteiro do mouse", "_mouse_"],
                    ["borda", "_edge_"]
                ]
            }
        ],
        "output": "Boolean",
        "colour": "#5CB1D6",
        "tooltip": "Verifica se o ator está tocando no objeto selecionado",
        "helpUrl": "",
        "extensions": ["dynamic_sprite_menu"]
    },
    {
        "type": "sensing_touchingcolor",
        "message0": "tocando na cor %1 ?",
        "args0": [
            {
                "type": "field_colour_hsv_sliders",
                "name": "COLOUR",
                "colour": "#ff0000"
            }
        ],
        "output": "Boolean",
        "colour": "#5CB1D6",
        "tooltip": "Verifica se o ator está tocando na cor selecionada",
        "helpUrl": ""
    },
    {
        "type": "sensing_coloristouchingcolor",
        "message0": "a cor %1 está tocando na cor %2 ?",
        "args0": [
            {
                "type": "field_colour_hsv_sliders",
                "name": "COLOUR1",
                "colour": "#ff0000"
            },
            {
                "type": "field_colour_hsv_sliders",
                "name": "COLOUR2",
                "colour": "#00ff00"
            }
        ],
        "output": "Boolean",
        "colour": "#5CB1D6",
        "tooltip": "Verifica se uma cor específica no ator está tocando outra cor no palco",
        "helpUrl": ""
    },
    {
        "type": "sensing_distanceto",
        "message0": "distância até %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "DISTANCETOMENU",
                "options": [
                    ["ponteiro do mouse", "_mouse_"]
                ]
            }
        ],
        "output": "Number",
        "colour": "#5CB1D6",
        "tooltip": "Retorna a distância entre este ator e o objeto selecionado",
        "helpUrl": "",
        "extensions": ["dynamic_sprite_menu"]
    },
    {
        "type": "sensing_askandwait",
        "message0": "pergunte %1 e espere",
        "args0": [
            {
                "type": "input_value",
                "name": "QUESTION",
                "check": ["String", "Number"]
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#5CB1D6",
        "tooltip": "Faz uma pergunta e espera o usuário digitar uma resposta",
        "helpUrl": ""
    },
    {
        "type": "sensing_answer",
        "message0": "resposta",
        "output": ["String", "Number"],
        "colour": "#5CB1D6",
        "tooltip": "Retorna o último texto digitado pelo usuário em resposta a uma pergunta",
        "helpUrl": ""
    },
    {
        "type": "sensing_keypressed",
        "message0": "tecla %1 pressionada?",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "KEY_OPTION",
                "options": [
                    ["qualquer", "any"],
                    ["espaço", "space"],
                    ["seta para cima", "up arrow"],
                    ["seta para baixo", "down arrow"],
                    ["seta para direita", "right arrow"],
                    ["seta para esquerda", "left arrow"],
                    ["enter", "enter"],
                    ["a", "a"], ["b", "b"], ["c", "c"], ["d", "d"], ["e", "e"], ["f", "f"],
                    ["g", "g"], ["h", "h"], ["i", "i"], ["j", "j"], ["k", "k"], ["l", "l"],
                    ["m", "m"], ["n", "n"], ["o", "o"], ["p", "p"], ["q", "q"], ["r", "r"],
                    ["s", "s"], ["t", "t"], ["u", "u"], ["v", "v"], ["w", "w"], ["x", "x"],
                    ["y", "y"], ["z", "z"], ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"],
                    ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]
                ]
            }
        ],
        "output": "Boolean",
        "colour": "#5CB1D6",
        "tooltip": "Verifica se a tecla selecionada está sendo pressionada no momento",
        "helpUrl": ""
    },
    {
        "type": "sensing_mousedown",
        "message0": "mouse pressionado?",
        "output": "Boolean",
        "colour": "#5CB1D6",
        "tooltip": "Verifica se o botão do mouse está clicado",
        "helpUrl": ""
    },
    {
        "type": "sensing_mousex",
        "message0": "x do mouse",
        "output": "Number",
        "colour": "#5CB1D6",
        "tooltip": "Retorna a posição horizontal atual do ponteiro do mouse",
        "helpUrl": ""
    },
    {
        "type": "sensing_mousey",
        "message0": "y do mouse",
        "output": "Number",
        "colour": "#5CB1D6",
        "tooltip": "Retorna a posição vertical atual do ponteiro do mouse",
        "helpUrl": ""
    },
    {
        "type": "sensing_timer",
        "message0": "cronômetro",
        "output": "Number",
        "colour": "#5CB1D6",
        "tooltip": "Retorna o tempo decorrido desde o início da execução ou do último reset",
        "helpUrl": ""
    },
    {
        "type": "sensing_resettimer",
        "message0": "reiniciar cronômetro",
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#5CB1D6",
        "tooltip": "Zera o contador do cronômetro",
        "helpUrl": ""
    },
    {
        "type": "sensing_of",
        "message0": "%1 de %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "PROPERTY",
                "options": [
                    ["posição x", "x"],
                    ["posição y", "y"],
                    ["direção", "direction"],
                    ["fantasia #", "costume_number"],
                    ["nome da fantasia", "costume_name"],
                    ["tamanho", "size"],
                    ["volume", "volume"]
                ]
            },
            {
                "type": "field_dropdown",
                "name": "OBJECT",
                "options": [
                    ["Palco", "_stage_"]
                ]
            }
        ],
        "output": ["String", "Number"],
        "colour": "#5CB1D6",
        "extensions": ["dynamic_sprite_menu"]
    },
    {
        "type": "sensing_current",
        "message0": "%1 atual",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "CURRENTMENU",
                "options": [
                    ["ano", "YEAR"],
                    ["mês", "MONTH"],
                    ["data", "DATE"],
                    ["dia da semana", "DAYOFWEEK"],
                    ["hora", "HOUR"],
                    ["minuto", "MINUTE"],
                    ["segundo", "SECOND"]
                ]
            }
        ],
        "output": "Number",
        "colour": "#5CB1D6"
    },
    {
        "type": "sensing_dayssince2000",
        "message0": "dias desde 2000",
        "output": "Number",
        "colour": "#5CB1D6"
    },
    {
        "type": "sensing_setdragmode",
        "message0": "defina modo de arrasto para %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "DRAG_MODE",
                "options": [
                    ["arrastável", "draggable"],
                    ["não arrastável", "not draggable"]
                ]
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#5CB1D6",
        "tooltip": "Define se o ator pode ser arrastado pelo usuário no modo tela cheia",
        "helpUrl": ""
    }
];
