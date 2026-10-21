const ML_COLOR = "#D94D4D";
const BRAIN_ICON = {
    "type": "field_image",
    "src": "/svg/cerebro_bloco.svg", // Reutilizando a imagem original do cérebro SVG
    "width": 34,
    "height": 34,
    "alt": "ML"
};

/**
 * Definições visuais dos blocos de Machine Learning para o modo Stage.
 * 
 * Utiliza o ícone do cérebro para identificação visual rápida e a 
 * extensão 'dynamic_ml_classes' para listar as classes treinadas pelo usuário.
 */
export const blockMachineLearning = [
    // 1. Abrir Janela
    {
        "type": "ml_open_recognition_window",
        "message0": "%1 abrir janela de reconhecimento",
        "args0": [BRAIN_ICON],
        "previousStatement": true,
        "nextStatement": true,
        "colour": ML_COLOR,
        "tooltip": "Abre a janela do ambiente de reconhecimento."
    },
    // 2. Fechar Janela
    {
        "type": "ml_close_recognition_window",
        "message0": "%1 fechar janela de reconhecimento",
        "args0": [BRAIN_ICON],
        "previousStatement": true,
        "nextStatement": true,
        "colour": ML_COLOR,
        "tooltip": "Fecha a janela do ambiente de reconhecimento."
    },
    // 5. É a classe identificada? (Boolean)
    {
        "type": "ml_is_identified_class",
        "message0": "%1 é a classe identificada %2",
        "args0": [
            BRAIN_ICON,
            {
                "type": "input_dummy",
                "name": "CLASS_INPUT"
            }
        ],
        "output": "Boolean",
        "colour": ML_COLOR,
        "extensions": ["dynamic_ml_classes"],
        "tooltip": "Verifica se a classe especificada foi detectada."
    },
    // 6. Classe Identificada (String/Repórter)
    {
        "type": "ml_identified_class",
        "message0": "%1 classe identificada",
        "args0": [BRAIN_ICON],
        "output": "String",
        "colour": ML_COLOR,
        "tooltip": "Retorna o nome da classe atualmente identificada."
    },
    // 7. Obter confiança
    {
        "type": "ml_get_confidence",
        "message0": "%1 obter porcentagem de acerto da %2",
        "args0": [
            BRAIN_ICON,
            {
                "type": "input_dummy",
                "name": "CLASS_INPUT"
            }
        ],
        "output": "Number",
        "colour": ML_COLOR,
        "extensions": ["dynamic_ml_classes"],
        "tooltip": "Retorna o nível de confiança (0 a 100) da detecção daquela classe."
    },
    // 8. Quando classe for prevista (Hat Block)
    {
        "type": "ml_when_predicted",
        "message0": "%1 quando %2",
        "args0": [
            BRAIN_ICON,
            {
                "type": "input_dummy",
                "name": "CLASS_INPUT"
            }
        ],
        "extensions": ["force_hat", "dynamic_ml_classes"],
        "nextStatement": true,
        "colour": ML_COLOR,
        "tooltip": "Dispara quando a classe selecionada é reconhecida."
    }
];
