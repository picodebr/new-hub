/**
 * Definições de blocos para Comunicação Serial no modo Board.
 */
export const blockSerial = [
    {
        "type": "board_serial_print",
        "message0": "escrever %1 na porta serial",
        "args0": [
            {
                "type": "input_value",
                "name": "CONTENT"
            }
        ],
        "previousStatement": true,
        "nextStatement": true,
        "colour": "#D35400",
        "tooltip": "Envia o valor para o Monitor Serial",
        "helpUrl": ""
    }
];
