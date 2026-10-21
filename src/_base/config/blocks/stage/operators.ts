/**
 * Definições visuais dos blocos de Operadores para o modo Stage.
 * 
 * Traduzido para Português seguindo o padrão Scratch 3.0.
 * Utiliza as extensões 'force_round_shape' para números e 'force_boolean_shape' para predicados.
 */
export const blockOperators = [
    // --- ARITMÉTICA CONSOLIDADA (Pedido do Usuário) ---
    {
        "type": "operator_arithmetic",
        "message0": "%1 %2 %3",
        "args0": [
            { "type": "input_value", "name": "NUM1", "check": ["Number", "String"] },
            {
                "type": "field_dropdown",
                "name": "OP",
                "options": [
                    ["+", "ADD"],
                    ["-", "SUBTRACT"],
                    ["*", "MULTIPLY"],
                    ["/", "DIVIDE"]
                ]
            },
            { "type": "input_value", "name": "NUM2", "check": ["Number", "String"] }
        ],
        "output": "Number",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_round_shape"]
    },

    // --- ARITMÉTICA (Originais) ---
    {
        "type": "operator_add",
        "message0": "%1 + %2",
        "args0": [
            { "type": "input_value", "name": "NUM1", "check": ["Number", "String"] },
            { "type": "input_value", "name": "NUM2", "check": ["Number", "String"] }
        ],
        "output": "Number",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_round_shape"]
    },
    {
        "type": "operator_subtract",
        "message0": "%1 - %2",
        "args0": [
            { "type": "input_value", "name": "NUM1", "check": ["Number", "String"] },
            { "type": "input_value", "name": "NUM2", "check": ["Number", "String"] }
        ],
        "output": "Number",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_round_shape"]
    },
    {
        "type": "operator_multiply",
        "message0": "%1 * %2",
        "args0": [
            { "type": "input_value", "name": "NUM1", "check": ["Number", "String"] },
            { "type": "input_value", "name": "NUM2", "check": ["Number", "String"] }
        ],
        "output": "Number",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_round_shape"]
    },
    {
        "type": "operator_divide",
        "message0": "%1 / %2",
        "args0": [
            { "type": "input_value", "name": "NUM1", "check": ["Number", "String"] },
            { "type": "input_value", "name": "NUM2", "check": ["Number", "String"] }
        ],
        "output": "Number",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_round_shape"]
    },

    // --- ALEATÓRIO ---
    {
        "type": "operator_random",
        "message0": "número aleatório entre %1 e %2",
        "args0": [
            { "type": "input_value", "name": "FROM", "check": "Number" },
            { "type": "input_value", "name": "TO", "check": "Number" }
        ],
        "output": "Number",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_round_shape"]
    },

    // --- COMPARAÇÃO ---
    {
        "type": "operator_gt",
        "message0": "%1 > %2",
        "args0": [
            { "type": "input_value", "name": "OPERAND1", "check": ["Number", "String"] },
            { "type": "input_value", "name": "OPERAND2", "check": ["Number", "String"] }
        ],
        "output": "Boolean",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_boolean_shape"]
    },
    {
        "type": "operator_lt",
        "message0": "%1 < %2",
        "args0": [
            { "type": "input_value", "name": "OPERAND1", "check": ["Number", "String"] },
            { "type": "input_value", "name": "OPERAND2", "check": ["Number", "String"] }
        ],
        "output": "Boolean",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_boolean_shape"]
    },
    {
        "type": "operator_equals",
        "message0": "%1 = %2",
        "args0": [
            { "type": "input_value", "name": "OPERAND1", "check": ["Number", "String"] },
            { "type": "input_value", "name": "OPERAND2", "check": ["Number", "String"] }
        ],
        "output": "Boolean",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_boolean_shape"]
    },

    // --- LÓGICA ---
    {
        "type": "operator_and",
        "message0": "%1 e %2",
        "args0": [
            { "type": "input_value", "name": "OPERAND1", "check": "Boolean" },
            { "type": "input_value", "name": "OPERAND2", "check": "Boolean" }
        ],
        "output": "Boolean",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_boolean_shape"]
    },
    {
        "type": "operator_or",
        "message0": "%1 ou %2",
        "args0": [
            { "type": "input_value", "name": "OPERAND1", "check": "Boolean" },
            { "type": "input_value", "name": "OPERAND2", "check": "Boolean" }
        ],
        "output": "Boolean",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_boolean_shape"]
    },
    {
        "type": "operator_not",
        "message0": "não %1",
        "args0": [
            { "type": "input_value", "name": "OPERAND", "check": "Boolean" }
        ],
        "output": "Boolean",
        "colour": "#59C059",
        "extensions": ["force_boolean_shape"]
    },

    // --- STRINGS ---
    {
        "type": "operator_join",
        "message0": "junte %1 com %2",
        "args0": [
            { "type": "input_value", "name": "STRING1", "check": ["String", "Number"] },
            { "type": "input_value", "name": "STRING2", "check": ["String", "Number"] }
        ],
        "output": "String",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_round_shape"]
    },
    {
        "type": "operator_letter_of",
        "message0": "letra %1 de %2",
        "args0": [
            { "type": "input_value", "name": "LETTER", "check": "Number" },
            { "type": "input_value", "name": "STRING", "check": ["String", "Number"] }
        ],
        "output": "String",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_round_shape"]
    },
    {
        "type": "operator_length",
        "message0": "tamanho de %1",
        "args0": [
            { "type": "input_value", "name": "STRING", "check": ["String", "Number"] }
        ],
        "output": "Number",
        "colour": "#59C059",
        "extensions": ["force_round_shape"]
    },
    {
        "type": "operator_contains",
        "message0": "%1 contém %2 ?",
        "args0": [
            { "type": "input_value", "name": "STRING1", "check": ["String", "Number"] },
            { "type": "input_value", "name": "STRING2", "check": ["String", "Number"] }
        ],
        "output": "Boolean",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_boolean_shape"]
    },

    // --- MATEMÁTICA ---
    {
        "type": "operator_mod",
        "message0": "resto de %1 por %2",
        "args0": [
            { "type": "input_value", "name": "NUM1", "check": "Number" },
            { "type": "input_value", "name": "NUM2", "check": "Number" }
        ],
        "output": "Number",
        "colour": "#59C059",
        "inputsInline": true,
        "extensions": ["force_round_shape"]
    },
    {
        "type": "operator_round",
        "message0": "arredonde %1",
        "args0": [
            { "type": "input_value", "name": "NUM", "check": "Number" }
        ],
        "output": "Number",
        "colour": "#59C059",
        "extensions": ["force_round_shape"]
    },
    {
        "type": "operator_mathop",
        "message0": "%1 de %2",
        "args0": [
            {
                "type": "field_dropdown",
                "name": "OPERATOR",
                "options": [
                    ["abs", "abs"],
                    ["teto", "floor"],
                    ["piso", "ceiling"],
                    ["raiz quadrada", "sqrt"],
                    ["sen", "sin"],
                    ["cos", "cos"],
                    ["tan", "tan"],
                    ["asen", "asin"],
                    ["acos", "acos"],
                    ["atan", "atan"],
                    ["ln", "ln"],
                    ["log", "log"],
                    ["e ^", "e^"],
                    ["10 ^", "10^"]
                ]
            },
            { "type": "input_value", "name": "NUM", "check": "Number" }
        ],
        "output": "Number",
        "colour": "#59C059",
        "extensions": ["force_round_shape"]
    },
    {
        "type": "operator_map",
        "message0": "mapear %1 de %2 – %3 para %4 – %5",
        "args0": [
            { "type": "input_value", "name": "VALUE", "check": "Number" },
            { "type": "input_value", "name": "FROM_LOW", "check": "Number" },
            { "type": "input_value", "name": "FROM_HIGH", "check": "Number" },
            { "type": "input_value", "name": "TO_LOW", "check": "Number" },
            { "type": "input_value", "name": "TO_HIGH", "check": "Number" }
        ],
        "inputsInline": true,
        "output": "Number",
        "colour": "#59C059",
        "tooltip": "Mapeia um valor de uma faixa para outra (equivalente ao map() do Arduino)",
        "extensions": ["force_round_shape"]
    }
];
