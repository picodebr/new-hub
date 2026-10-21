/**
 * Definições visuais dos blocos de Eventos (Events) para o modo Stage.
 */
export const blockEvents = [
    {
        "type": "when_play_clicked",
        "message0": "quando %1 clicado",
        "args0": [
            {
                "type": "field_image",
                "src": 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%2300ff1e" viewBox="0 0 16 16"><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>',
                "width": 32,
                "height": 32,
                "alt": "Play"
            }
        ], "extensions": ["force_hat"],
        "nextStatement": true,
        "colour": "#FFBF00"
    },
    {
        "type": "event_when_key_pressed",
        "message0": "quando a tecla %1 for pressionada",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "KEY_OPTION",
                "options": [
                    ["espaço", " "],
                    ["seta cima", "ArrowUp"],
                    ["seta baixo", "ArrowDown"],
                    ["seta direita", "ArrowRight"],
                    ["seta esquerda", "ArrowLeft"],
                    ["a", "a"],
                    ["b", "b"],
                    ["c", "c"],
                    ["d", "d"],
                    ["w", "w"],
                    ["s", "s"],
                    ["enter", "Enter"]
                ]
            }
        ],
        "nextStatement": true,
        "colour": "#FFBF00",
        "extensions": ["force_hat"],
        "tooltip": "Executa o código quando a tecla específica é pressionada"
    },
    {
        "type": "quando_receber",
        "message0": "quando eu receber %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "MENSAGEM",
                "options": [
                    ["mensagem 1", "mensagem1"],
                    ["nova mensagem...", "nova_mensagem"]
                ]
            }
        ],
        "extensions": ["force_hat", "dynamic_broadcast_menu"],
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Inicia o script colado abaixo quando a mensagem for chamada."
    },
    {
        "type": "transmitir",
        "message0": "transmita %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "MENSAGEM",
                "options": [
                    ["mensagem 1", "mensagem1"],
                    ["nova mensagem...", "nova_mensagem"]
                ]
            }
        ],
        "extensions": ["dynamic_broadcast_menu"],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Dispara a mensagem para todos e continua o script imediatamente."
    },
    {
        "type": "transmitir_e_esperar",
        "message0": "transmita %1 e espere",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "MENSAGEM",
                "options": [
                    ["mensagem 1", "mensagem1"],
                    ["nova mensagem...", "nova_mensagem"]
                ]
            }
        ],
        "extensions": ["dynamic_broadcast_menu"],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Dispara a mensagem e pausa este script até que todos os receptores terminem."
    },
    {
        "type": "event_when_backdrop_switches_to",
        "message0": "quando o cenário mudar para %1",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "BACKDROP",
                "options": [
                    ["Cenário 1", "b1"]
                ]
            }
        ],
        "extensions": ["force_hat", "dynamic_backdrop_menu"],
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Executa o script quando o cenário do palco mudar para o selecionado."
    },
    {
        "type": "event_whenstageclicked",
        "message0": "quando o palco for clicado",
        "args0": [],
        "extensions": ["force_hat"],
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Executa o script abaixo quando o usuário clica no fundo do palco."
    },
    {
        "type": "when_sprite_clicked",
        "message0": "quando este ator for clicado",
        "args0": [],
        "extensions": ["force_hat"],
        "nextStatement": true,
        "colour": "#FFBF00",
        "tooltip": "Executa o script abaixo quando o usuário clica neste ator."
    }
];

