/**
 * Tradução para JavaScript dos blocos de Aparência (say, think, costumes, backdrops).
 */
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const initLooksGenerators = () => {
    // BLOCOS DE APARÊNCIA
    // ==================================================
    javascriptGenerator.forBlock['looks_say_for_secs'] = function (block: Blockly.Block) {
        const message = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.ATOMIC) || '""';
        const secs = javascriptGenerator.valueToCode(block, 'SECS', Order.ATOMIC) || '0';
        return `await sprite.sayFor(${message}, ${secs});\n`;
    };

    javascriptGenerator.forBlock['looks_say'] = function (block: Blockly.Block) {
        const message = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.ATOMIC) || '""';
        return `sprite.say(${message});\n`;
    };

    javascriptGenerator.forBlock['looks_think_for_secs'] = function (block: Blockly.Block) {
        const message = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.ATOMIC) || '""';
        const secs = javascriptGenerator.valueToCode(block, 'SECS', Order.ATOMIC) || '0';
        return `await sprite.thinkFor(${message}, ${secs});\n`;
    };

    javascriptGenerator.forBlock['looks_think'] = function (block: Blockly.Block) {
        const message = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.ATOMIC) || '""';
        return `sprite.think(${message});\n`;
    };

    javascriptGenerator.forBlock['looks_switch_backdrop'] = function (block: Blockly.Block) {
        const backdrop = block.getFieldValue('BACKDROP');
        return `await stage.switchBackdrop('${backdrop}');\n`;
    };

    javascriptGenerator.forBlock['looks_next_backdrop'] = function (_block: Blockly.Block) {
        return `await stage.switchBackdrop('NEXT');\n`;
    };

    javascriptGenerator.forBlock['looks_switch_costume'] = function (block: Blockly.Block) {
        const costume = block.getFieldValue('COSTUME');
        return `await sprite.switchCostume('${costume}');\n`;
    };

    javascriptGenerator.forBlock['looks_next_costume'] = function (_block: Blockly.Block) {
        return `await sprite.switchCostume('NEXT');\n`;
    };

    javascriptGenerator.forBlock['looks_set_size'] = function (block: Blockly.Block) {
        const size = javascriptGenerator.valueToCode(block, 'SIZE', Order.ATOMIC) || '100';
        return `await sprite.setSize(${size});\n`;
    };

    javascriptGenerator.forBlock['looks_change_size'] = function (block: Blockly.Block) {
        const change = javascriptGenerator.valueToCode(block, 'CHANGE', Order.ATOMIC) || '10';
        return `await sprite.changeSize(${change});\n`;
    };

    javascriptGenerator.forBlock['looks_show'] = function (_block: Blockly.Block) {
        return `await sprite.show();\n`;
    };

    javascriptGenerator.forBlock['looks_hide'] = function (_block: Blockly.Block) {
        return `await sprite.hide();\n`;
    };

    javascriptGenerator.forBlock['looks_changeeffectby'] = function (block: Blockly.Block) {
        const effect = block.getFieldValue('EFFECT');
        const change = javascriptGenerator.valueToCode(block, 'CHANGE', Order.ATOMIC) || '0';
        return `await sprite.changeEffect('${effect}', ${change});\n`;
    };

    javascriptGenerator.forBlock['looks_seteffectto'] = function (block: Blockly.Block) {
        const effect = block.getFieldValue('EFFECT');
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.setEffect('${effect}', ${value});\n`;
    };

    javascriptGenerator.forBlock['looks_cleargraphiceffects'] = function (_block: Blockly.Block) {
        return `await sprite.clearEffects();\n`;
    };

    javascriptGenerator.forBlock['looks_gotofrontback'] = function (block: Blockly.Block) {
        const layer = block.getFieldValue('FRONT_BACK');
        return `await sprite.goToLayer('${layer}');\n`;
    };

    javascriptGenerator.forBlock['looks_goforwardbackwardlayers'] = function (block: Blockly.Block) {
        const dir = block.getFieldValue('FORWARD_BACKWARD');
        const num = javascriptGenerator.valueToCode(block, 'NUM', Order.ATOMIC) || '1';
        const finalNum = dir === 'backward' ? `-${num}` : num;
        return `await sprite.goForwardLayers(${finalNum});\n`;
    };

    javascriptGenerator.forBlock['looks_costumenumbername'] = function (block: Blockly.Block) {
        const type = block.getFieldValue('NUMBER_NAME');
        const code = type === 'name' ? `sprite.costumeName` : `sprite.costumeNumber`;
        return [code, Order.ATOMIC];
    };


    javascriptGenerator.forBlock['looks_backdropnumbername'] = function (block: Blockly.Block) {
        const type = block.getFieldValue('NUMBER_NAME');
        const code = type === 'name' ? `stage.backdropName` : `stage.backdropNumber`;
        return [code, Order.ATOMIC];
    };


    javascriptGenerator.forBlock['looks_size'] = function (_block: Blockly.Block) {
        return [`sprite.size`, Order.ATOMIC];
    };


    javascriptGenerator.forBlock['looks_switchbackdroptoandwait'] = function (block: Blockly.Block) {
        const backdrop = block.getFieldValue('BACKDROP');
        return `await stage.switchBackdropAndWait('${backdrop}');\n`;
    };
};
