/**
 * Definições visuais dos blocos de Aparência (Looks) para o modo Stage.
 */
export const blockLooks = [
    {
        "type": "looks_say_for_secs",
        "message0": "diga %1 por %2 segundos",
        "args0": [
            {
                "type": "input_value",
                "name": "MESSAGE",
                "check": ["String", "Number"]
            },
            {
                "type": "input_value",
                "name": "SECS",
                "check": "Number"
            }
        ],
        "inputsInline": true,
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Mostra um balão de fala por um tempo"
    },
    {
        "type": "looks_say",
        "message0": "diga %1",
        "args0": [
            {
                "type": "input_value",
                "name": "MESSAGE",
                "check": ["String", "Number"]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Mostra um balão de fala indefinidamente"
    },
    {
        "type": "looks_think_for_secs",
        "message0": "pense %1 por %2 segundos",
        "args0": [
            {
                "type": "input_value",
                "name": "MESSAGE",
                "check": ["String", "Number"]
            },
            {
                "type": "input_value",
                "name": "SECS",
                "check": "Number"
            }
        ],
        "inputsInline": true,
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Mostra um balão de pensamento por um tempo"
    },
    {
        "type": "looks_think",
        "message0": "pense %1",
        "args0": [
            {
                "type": "input_value",
                "name": "MESSAGE",
                "check": ["String", "Number"]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Mostra um balão de pensamento"
    },
    {
        "type": "looks_set_size",
        "message0": "defina o tamanho como %1 %%",
        "args0": [
            {
                "type": "input_value",
                "name": "SIZE",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Define o tamanho do ator em porcentagem"
    },
    {
        "type": "looks_change_size",
        "message0": "adicione %1 ao tamanho",
        "args0": [
            {
                "type": "input_value",
                "name": "CHANGE",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Aumenta ou diminui o tamanho do ator"
    },
    {
        "type": "looks_show",
        "message0": "mostre",
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Torna o ator visível"
    },
    {
        "type": "looks_hide",
        "message0": "esconda",
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Torna o ator invisível"
    },

    {
        "type": "say_message",
        "message0": "dizer %1",
        "args0": [
            { "type": "input_value", "name": "MESSAGE", "check": "String" }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF"
    },
    {
        "type": "looks_switch_backdrop",
        "message0": "mude o cenário para %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "BACKDROP",
                "options": [
                    ["próximo cenário", "NEXT"],
                    ["cenário anterior", "PREVIOUS"],
                    ["cenário aleatório", "RANDOM"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Muda o cenário do palco"
    },
    {
        "type": "looks_next_backdrop",
        "message0": "próximo cenário",
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Muda para o próximo cenário"
    },
    {
        "type": "looks_switch_costume",
        "message0": "mude a fantasia para %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "COSTUME",
                "options": [
                    ["próxima fantasia", "NEXT"],
                    ["fantasia anterior", "PREVIOUS"],
                    ["fantasia aleatória", "RANDOM"]
                ]
            }
        ],
        "extensions": ["dynamic_costume_menu"],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Muda a fantasia do ator selecionando da lista dinâmica."
    },
    {
        "type": "looks_next_costume",
        "message0": "próxima fantasia",
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Muda para a próxima fantasia"
    },
    {
        "type": "looks_changeeffectby",
        "message0": "adicione %2 ao efeito %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "EFFECT",
                "options": [
                    ["cor", "color"],
                    ["olho de peixe", "fisheye"],
                    ["vórtice", "whirl"],
                    ["pixelar", "pixelate"],
                    ["mosaico", "mosaic"],
                    ["brilho", "brightness"],
                    ["fantasma", "ghost"]
                ]
            },
            {
                "type": "input_value",
                "name": "CHANGE",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Altera um efeito gráfico"
    },
    {
        "type": "looks_seteffectto",
        "message0": "defina o efeito %1 como %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "EFFECT",
                "options": [
                    ["cor", "color"],
                    ["olho de peixe", "fisheye"],
                    ["vórtice", "whirl"],
                    ["pixelar", "pixelate"],
                    ["mosaico", "mosaic"],
                    ["brilho", "brightness"],
                    ["fantasma", "ghost"]
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
        "colour": "#9966FF",
        "tooltip": "Define o valor de um efeito gráfico"
    },
    {
        "type": "looks_cleargraphiceffects",
        "message0": "remova os efeitos gráficos",
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Remove todos os efeitos gráficos do ator"
    },
    {
        "type": "looks_gotofrontback",
        "message0": "vá para a camada %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "FRONT_BACK",
                "options": [
                    ["frente", "front"],
                    ["trás", "back"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Move o ator para a camada mais à frente ou mais atrás"
    },
    {
        "type": "looks_goforwardbackwardlayers",
        "message0": "vá %1 %2 camadas",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "FORWARD_BACKWARD",
                "options": [
                    ["para frente", "forward"],
                    ["para trás", "backward"]
                ]
            },
            {
                "type": "input_value",
                "name": "NUM",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Move o ator um número específico de camadas"
    },
    {
        "type": "looks_costumenumbername",
        "message0": "fantasia %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "NUMBER_NAME",
                "options": [
                    ["número", "number"],
                    ["nome", "name"]
                ]
            }
        ],
        "output": ["Number", "String"],
        "colour": "#9966FF",
        "tooltip": "Retorna o número ou o nome da fantasia atual"
    },
    {
        "type": "looks_backdropnumbername",
        "message0": "cenário %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "NUMBER_NAME",
                "options": [
                    ["número", "number"],
                    ["nome", "name"]
                ]
            }
        ],
        "output": ["Number", "String"],
        "colour": "#9966FF",
        "tooltip": "Retorna o número ou o nome do cenário atual"
    },
    {
        "type": "looks_size",
        "message0": "tamanho",
        "output": "Number",
        "colour": "#9966FF",
        "tooltip": "Retorna o tamanho do ator"
    },
    {
        "type": "looks_switchbackdroptoandwait",
        "message0": "mude o cenário para %1 e espere",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "BACKDROP",
                "options": [
                    ["próximo cenário", "NEXT"],
                    ["cenário anterior", "PREVIOUS"],
                    ["cenário aleatório", "RANDOM"]
                ]
            }
        ],
        "extensions": ["dynamic_backdrop_menu"],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#9966FF",
        "tooltip": "Muda o cenário e aguarda a execução de scripts iniciados pela mudança"
    }
];
