/**
 * Tradução para JavaScript dos blocos de Machine Learning para o modo Stage.
 */
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const initMLGenerators = () => {
    // BLOCOS DE MACHINE LEARNING
    // ==================================================
    javascriptGenerator.forBlock['ml_open_recognition_window'] = function (_block: Blockly.Block) {
        return `await stage.openMLWindow();\n`;
    };

    javascriptGenerator.forBlock['ml_close_recognition_window'] = function (_block: Blockly.Block) {
        return `await stage.closeMLWindow();\n`;
    };

    // Para blocos que retornam valor (Repórteres/Booleanos)
    javascriptGenerator.forBlock['ml_is_identified_class'] = function (block: Blockly.Block) {
        const className = block.getFieldValue('CLASS');
        const code = `stage.isIdentifiedClass('${className}')`;
        return [code, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['ml_identified_class'] = function (_block: Blockly.Block) {
        const code = `stage.getIdentifiedClass()`;
        return [code, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['ml_get_confidence'] = function (block: Blockly.Block) {
        const className = block.getFieldValue('CLASS');
        const code = `stage.getConfidence('${className}')`;
        return [code, Order.FUNCTION_CALL];
    };

    // Bloco Hat (Evento) - Normalmente tratado de forma especial pelo interpretador de eventos,
    // mas se for gerar código contínuo, não tem retorno de valor, fica no topo do script.
    javascriptGenerator.forBlock['ml_when_predicted'] = function (_block: Blockly.Block) {
        // O motor de eventos do Scratch costuma ler os blocos Hat diretamente para iniciar threads.
        // No caso do gerador genérico, indicamos o escopo ou simplesmente deixamos vazio 
        // caso o motor que roda seja baseado em AST (Árvore de Sintaxe).
        // const className = block.getFieldValue('CLASS');
        return `// EVENT: when_predicted\n`;
    };
};
