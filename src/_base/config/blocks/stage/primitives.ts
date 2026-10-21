/**
 * Definições visuais de blocos primitivos e utilitários para o modo Stage.
 */
export const blockPrimitives = [
    {
        "type": "math_number",
        "message0": "%1",
        "args0": [{ "type": "field_number", "name": "NUM", "value": 0 }],
        "output": "Number",
        "colour": "#59C059"
    },

    {
        "type": "text",
        "message0": "%1",
        "args0": [{ "type": "field_input", "name": "TEXT", "text": "" }],
        "output": "String",
        "colour": "#59C059",
        "extensions": ["limit_150_chars"]
    }
];
