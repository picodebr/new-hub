
const ARTBOT_COLOR = "#bababa";
const ARTBOT_ICON = {
    "type": "field_image",
    "src": "/svg/artBot-bloco.svg",
    "width": 40,
    "height": 40,
    "alt": "Artbot"
};

const ARTBOT_SEPARATOR = {
    "type": "field_image",
    "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDEgNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iNDAiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMjUiLz48L3N2Zz4=",
    "width": 2,
    "height": 40,
    "alt": "|"
};

/**
 * Definições de blocos para o kit Artbot no modo Board.
 */
export const blockArtbotUpload = [
    {
        "type": "artbot_move",
        "message0": "%1 %2 %3 andar para %4 por %5 passos",
        "args0": [
            ARTBOT_ICON,
            ARTBOT_SEPARATOR,
            { "type": "input_dummy" },
            {
                "type": "field_dropdown",
                "name": "DIR",
                "options": [
                    ["frente", "FORWARD"],
                    ["trás", "BACKWARD"]
                ]
            },
            {
                "type": "input_value",
                "name": "STEPS",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": ARTBOT_COLOR,
        "tooltip": "Move o robô na direção escolhida pela quantidade de passos definida.",
        "inputsInline": true
    },
    {
        "type": "artbot_turn",
        "message0": "%1 %2 %3 virar para %4 por %5 passos",
        "args0": [
            ARTBOT_ICON,
            ARTBOT_SEPARATOR,
            { "type": "input_dummy" },
            {
                "type": "field_dropdown",
                "name": "DIR",
                "options": [
                    ["esquerda", "LEFT"],
                    ["direita", "RIGHT"]
                ]
            },
            {
                "type": "input_value",
                "name": "STEPS",
                "check": "Number"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": ARTBOT_COLOR,
        "tooltip": "Vira o robô para o lado escolhido.",
        "inputsInline": true
    },
    {
        "type": "artbot_action",
        "message0": "%1 %2 %3 %4",
        "args0": [
            ARTBOT_ICON,
            ARTBOT_SEPARATOR,
            { "type": "input_dummy" },
            {
                "type": "field_dropdown",
                "name": "ACTION",
                "options": [
                    ["sentar", "SIT"],
                    ["levantar", "STANDUP"],
                    ["equilibrar", "BALANCE"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": ARTBOT_COLOR,
        "tooltip": "Faz o robô sentar, levantar.",
        "inputsInline": true
    }, {
        "type": "artbot_dance",
        "message0": "%1dançar %2 %3 %4",
        "args0": [
            ARTBOT_ICON,
            ARTBOT_SEPARATOR,
            { "type": "input_dummy" },
            {
                "type": "field_dropdown",
                "name": "DANCE",
                "options": [
                    ["Ballet", "BALLET"],
                    ["Moonwalker para a esquerda", "MOONWALKER_LEFT"],
                    ["Moonwalker para a direita", "MOONWALKER_RIGHT"],
                    ["Passo cruzado para a esquerda", "CROSSSTEP_LEFT"],
                    ["Passo cruzado para a direita", "CROSSSTEP_RIGHT"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": ARTBOT_COLOR,
        "tooltip": "Faz o robô dançar.",
        "inputsInline": true
    },
    {
        "type": "artbot_sing",
        "message0": "%1 %2 %3 cantar %4",
        "args0": [
            ARTBOT_ICON,
            ARTBOT_SEPARATOR,
            { "type": "input_dummy" },
            {
                "type": "field_dropdown",
                "name": "SONG",
                "options": [
                    ["fofinho", "S_cuddly"],
                    ["oh-ooh", "S_OhOoh"],
                    ["oh-ooh 2", "S_OhOoh2"],
                    ["surpresa", "S_surprise"],
                    ["botão pressionado", "S_buttonPushed"],
                    ["modo 1", "S_mode1"],
                    ["modo 2", "S_mode2"],
                    ["modo 3", "S_mode3"],
                    ["dormindo", "S_sleeping"],
                    ["pum 1", "S_fart1"],
                    ["pum 2", "S_fart2"],
                    ["pum 3", "S_fart3"],
                    ["feliz", "S_happy"],
                    ["feliz curto", "S_happy_short"],
                    ["super feliz", "S_superHappy"],
                    ["triste", "S_sad"],
                    ["confuso", "S_confused"],
                    ["desconectado", "S_disconnection"],
                    ["parabéns", "SONG_BIRTHDAY"]
                ]
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": ARTBOT_COLOR,
        "tooltip": "Faz o robô emitir um som ou música.",
        "inputsInline": true
    },
    {
        "type": "artbot_home",
        "message0": "%1 %2 %3 posição inicial",
        "args0": [
            ARTBOT_ICON,
            ARTBOT_SEPARATOR,
            { "type": "input_dummy" }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": ARTBOT_COLOR,
        "tooltip": "Retorna o robô para a posição inicial (home).",
        "inputsInline": true
    },
    {
        "type": "artbot_is_obstacle",
        "message0": "%1 %2 %3 distância %4 %5 cm",
        "args0": [
            ARTBOT_ICON,
            ARTBOT_SEPARATOR,
            { "type": "input_dummy" },
            {
                "type": "field_dropdown",
                "name": "OP",
                "options": [
                    ["<", "LT"],
                    ["<=", "LTE"],
                    ["=", "EQ"],
                    [">", "GT"],
                    [">=", "GTE"]
                ]
            },
            {
                "type": "input_value",
                "name": "DISTANCE",
                "check": "Number",
                "align": "RIGHT"
            }
        ],
        "output": "Boolean",
        "colour": ARTBOT_COLOR,
        "tooltip": "Verifica se há um obstáculo a menos da distância definida.",
        "inputsInline": true
    }
];
