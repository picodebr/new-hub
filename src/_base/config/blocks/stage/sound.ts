/**
 * Definições visuais dos blocos de Som para o modo Stage.
 */
export const blockSound = [
    {
        "type": "sound_playuntildone",
        "message0": "tocar o som %1 até o fim",
        "args0": [
            { "type": "field_dropdown", "name": "SOUND_MENU", "options": [["(sem sons)", "NONE"]] }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#CF63CF",
        "extensions": ["dynamic_sound_menu"]
    },
    {
        "type": "sound_play",
        "message0": "iniciar o som %1",
        "args0": [
            { "type": "field_dropdown", "name": "SOUND_MENU", "options": [["(sem sons)", "NONE"]] }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#CF63CF",
        "extensions": ["dynamic_sound_menu"]
    },
    {
        "type": "sound_stopallsounds",
        "message0": "pare todos os sons",
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#CF63CF"
    },
    {
        "type": "sound_changeeffectby",
        "message0": "adicione %2 ao efeito %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "EFFECT",
                "options": [
                    ["altura", "PITCH"],
                    ["panorâmico para a esquerda/direita", "PAN"]
                ]
            },
            { "type": "input_value", "name": "VALUE", "check": "Number" }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#CF63CF"
    },
    {
        "type": "sound_seteffectto",
        "message0": "mude o efeito %1 para %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "EFFECT",
                "options": [
                    ["altura", "PITCH"],
                    ["panorâmico para a esquerda/direita", "PAN"]
                ]
            },
            { "type": "input_value", "name": "VALUE", "check": "Number" }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#CF63CF"
    },
    {
        "type": "sound_cleareffects",
        "message0": "limpe os efeitos de som",
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#CF63CF"
    },
    {
        "type": "sound_changevolumeby",
        "message0": "adicione %1 ao volume",
        "args0": [
            { "type": "input_value", "name": "VOLUME", "check": "Number" }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#CF63CF"
    },
    {
        "type": "sound_setvolumeto",
        "message0": "mude o volume para %1 %%",
        "args0": [
            { "type": "input_value", "name": "VOLUME", "check": "Number" }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#CF63CF"
    },
    {
        "type": "sound_volume",
        "message0": "volume",
        "output": "Number",
        "colour": "#CF63CF",
        "extensions": ["force_round_shape"]
    }
];
