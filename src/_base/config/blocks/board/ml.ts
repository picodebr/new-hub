/**
 * Definições de Blocos ML para o Modo Upload (Arduino/Placa).
 *
 * Bloco "quando receber classe" — lê a classe enviada pelo browser via Serial
 * e gera um if/else if para cada classe do modelo.
 */

const ML_UPLOAD_COLOR = "#D94D4D";
const BRAIN_ICON = {
    "type": "field_image",
    "src": "/svg/cerebro_bloco.svg",
    "width": 44,
    "height": 44,
    "alt": "ML"
};

/**
 * Definições de blocos de Machine Learning para o modo Board.
 */
export const blockMLUpload = [
    {
        "type": "ml_upload_on_class",
        "message0": "%1 quando receber classe %2 executar",
        "args0": [
            BRAIN_ICON,
            {
                "type": "input_dummy",
                "name": "CLASS_INPUT"
            }
        ],
        "message1": "%1",
        "args1": [
            {
                "type": "input_statement",
                "name": "DO"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": ML_UPLOAD_COLOR,
        "tooltip": "Quando o browser enviar o nome desta classe via Serial, executa o código dentro.",
        "inputsInline": true,
        "extensions": ["dynamic_vision_classes_upload"]
    },
    {
        "type": "ml_upload_current_class",
        "message0": "%1 classe %2 detectada",
        "args0": [
            BRAIN_ICON,
            {
                "type": "input_dummy",
                "name": "CLASS_INPUT"
            }
        ],
        "output": "Boolean",
        "colour": ML_UPLOAD_COLOR,
        "extensions": ["dynamic_vision_classes_upload"],
        "tooltip": "Verdadeiro se esta classe for a detectada no Serial",
        "inputsInline": true
    },
    {
        "type": "ml_upload_identified_class",
        "message0": "%1 classe identificada",
        "args0": [
            BRAIN_ICON
        ],
        "output": "String",
        "colour": ML_UPLOAD_COLOR,
        "tooltip": "Retorna o nome da classe atualmente identificada via Serial.",
        "inputsInline": true
    },
    {
        "type": "ml_upload_get_confidence",
        "message0": "%1 porcentagem de %2",
        "args0": [
            BRAIN_ICON,
            {
                "type": "input_dummy",
                "name": "CLASS_INPUT"
            }
        ],
        "output": "Number",
        "colour": ML_UPLOAD_COLOR,
        "extensions": ["dynamic_vision_classes_upload"],
        "tooltip": "Retorna a porcentagem de confiança (0 a 100) da classe selecionada.",
        "inputsInline": true
    }
];
