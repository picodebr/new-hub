/**
 * Tradução para JavaScript dos blocos de Eventos (transmitir, transmitir_e_esperar).
 */
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';

export const initEventsGenerators = () => {
    // BLOCOS DE MENSAGENS / TRANSMISSÃO
    // ==================================================
    
    // O bloco 'quando_receber' é um bloco de início (Hat Block).
    // Ele não gera código para ser executado em sequência, pois o runner procura por ele
    // especificamente para disparar novas threads.
    javascriptGenerator.forBlock['quando_receber'] = function (_block: Blockly.Block) {
        return '';
    };

    javascriptGenerator.forBlock['transmitir'] = function (block: Blockly.Block) {
        const mensagem = block.getFieldValue('MENSAGEM');
        return `await sprite.broadcast("${mensagem}");\n`;
    };

    javascriptGenerator.forBlock['transmitir_e_esperar'] = function (block: Blockly.Block) {
        const mensagem = block.getFieldValue('MENSAGEM');
        return `await sprite.broadcastAndWait("${mensagem}");\n`;
    };

    // BLOCOS DE CLIQUE NO OBJETO / CENÁRIO (Hat Blocks)
    // - O runner procura por estes blocos em BlocklyWorkspace.checkStageClickEvents
    //   e BlocklyWorkspace.checkSpriteClickEvents e extrai o código do bloco seguinte.
    javascriptGenerator.forBlock['event_whenstageclicked'] = function (_block: Blockly.Block) {
        return '';
    };

    javascriptGenerator.forBlock['when_sprite_clicked'] = function (_block: Blockly.Block) {
        return '';
    };

    // BLOCOS DE MUDANÇA DE CENÁRIO (Hat Blocks)
    // - O runner procura por estes blocos em useCodeExecution/HeadlessRunner.
    javascriptGenerator.forBlock['event_when_backdrop_switches_to'] = function (_block: Blockly.Block) {
        return '';
    };
};

