/**
 * Blocos de estrutura básica (Setup/Loop) para o modo Board.
 * 
 * Nota: O uso da extensão 'force_hat' garante que estes blocos 
 * sejam raízes obrigatórias (não permitem conexão superior).
 */
export const blockStructure = [
    /**
     * Bloco de Inicialização (Setup)
     * Executado apenas uma vez quando a placa liga.
     */
    {
        "type": "setup_block",
        "message0": "setup %1",
        "args0": [
            {
                "type": "field_image",
                "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
                "width": 120,
                "height": 1,
                "alt": "*"
            }
        ],
        "nextStatement": null,
        "colour": "#F4B400",
        "extensions": ["force_hat"],
        "tooltip": "Setup (Executado uma vez no início)",
        "helpUrl": ""
    },
    /**
     * Bloco de Loop Principal
     * Executado continuamente após o setup.
     */
    {
        "type": "loop_block",
        "message0": "loop %1",
        "args0": [
            {
                "type": "field_image",
                "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
                "width": 120,
                "height": 1,
                "alt": "*"
            }
        ],
        "nextStatement": null,
        "colour": "#F4B400",
        "extensions": ["force_hat"],
        "tooltip": "Loop (Repete continuamente)",
        "helpUrl": ""
    }
];
