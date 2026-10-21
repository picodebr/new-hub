/**
 * Definições JSON dos blocos de Listas para o modo Stage.
 *
 * Estratégia: Listas são variáveis Blockly com type="list".
 * O campo LIST usa field_variable com variableTypes=["list"], de forma que
 * o workspace gerencia o ID e o nome automaticamente.
 */

// ── data_listcontents (Reporter do conteúdo da lista) ───────
const blockListContents = [
    {
        "type": "data_listcontents",
        "message0": "conteúdo de %1",
        "args0": [
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "output": null,
        "colour": "#FF8C1A",
        "tooltip": "Retorna o conteúdo completo da lista como texto."
    }
];

export const blockVariables = [
    ...blockListContents,
    // ── Operações de Lista (Comandos) ─────────────────────────

    {
        "type": "data_addtolist",
        "message0": "adicionar %1 à lista %2",
        "args0": [
            { "type": "input_value", "name": "ITEM" },
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF8C1A",
        "tooltip": "Adiciona um item ao final da lista."
    },
    {
        "type": "data_deleteoflist",
        "message0": "apagar item %1 de %2",
        "args0": [
            { "type": "input_value", "name": "INDEX", "check": "Number" },
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF8C1A",
        "tooltip": "Apaga o item na posição indicada (1 = primeiro, use 'last' para o último)."
    },
    {
        "type": "data_deletealloflist",
        "message0": "apagar todos de %1",
        "args0": [
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF8C1A",
        "tooltip": "Remove todos os itens da lista."
    },
    {
        "type": "data_insertatlist",
        "message0": "inserir %1 na posição %2 de %3",
        "args0": [
            { "type": "input_value", "name": "ITEM" },
            { "type": "input_value", "name": "INDEX", "check": "Number" },
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF8C1A",
        "tooltip": "Insere um item na posição indicada da lista."
    },
    {
        "type": "data_replaceitemoflist",
        "message0": "substituir item %1 de %2 por %3",
        "args0": [
            { "type": "input_value", "name": "INDEX", "check": "Number" },
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            },
            { "type": "input_value", "name": "ITEM" }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF8C1A",
        "tooltip": "Substitui o item na posição indicada pelo novo valor."
    },
    {
        "type": "data_showlist",
        "message0": "mostrar lista %1",
        "args0": [
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF8C1A",
        "tooltip": "Exibe o monitor da lista no palco."
    },
    {
        "type": "data_hidelist",
        "message0": "esconder lista %1",
        "args0": [
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#FF8C1A",
        "tooltip": "Oculta o monitor da lista no palco."
    },

    // ── Reporters de Lista (Valores) ──────────────────────────

    {
        "type": "data_itemoflist",
        "message0": "item %1 de %2",
        "args0": [
            { "type": "input_value", "name": "INDEX", "check": "Number" },
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "output": null,
        "colour": "#FF8C1A",
        "tooltip": "Retorna o item na posição indicada da lista (1 = primeiro)."
    },
    {
        "type": "data_itemnumoflist",
        "message0": "posição de %1 em %2",
        "args0": [
            { "type": "input_value", "name": "ITEM" },
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "output": "Number",
        "colour": "#FF8C1A",
        "tooltip": "Retorna a posição do item na lista (0 se não encontrado)."
    },
    {
        "type": "data_lengthoflist",
        "message0": "comprimento de %1",
        "args0": [
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            }
        ],
        "inputsInline": true,
        "output": "Number",
        "colour": "#FF8C1A",
        "tooltip": "Retorna a quantidade de itens na lista."
    },
    {
        "type": "data_listcontainsitem",
        "message0": "%1 contém %2?",
        "args0": [
            {
                "type": "field_variable",
                "name": "LIST",
                "variableTypes": ["list"],
                "defaultType": "list"
            },
            { "type": "input_value", "name": "ITEM" }
        ],
        "inputsInline": true,
        "output": "Boolean",
        "colour": "#FF8C1A",
        "tooltip": "Verdadeiro se a lista contém o item especificado."
    }
];
