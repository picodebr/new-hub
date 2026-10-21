import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const initSoundGenerators = () => {
    javascriptGenerator.forBlock['sound_playuntildone'] = function (block: Blockly.Block) {
        const sound = block.getFieldValue('SOUND_MENU');
        return `await sprite.playSoundUntilDone('${sound}');\n`;
    };

    javascriptGenerator.forBlock['sound_play'] = function (block: Blockly.Block) {
        const sound = block.getFieldValue('SOUND_MENU');
        return `await sprite.playSound('${sound}');\n`;
    };

    javascriptGenerator.forBlock['sound_stopallsounds'] = function () {
        return `await stage.stopAllSounds();\n`;
    };

    javascriptGenerator.forBlock['sound_changeeffectby'] = function (block: Blockly.Block) {
        const effect = block.getFieldValue('EFFECT');
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.changeSoundEffect('${effect}', ${value});\n`;
    };

    javascriptGenerator.forBlock['sound_seteffectto'] = function (block: Blockly.Block) {
        const effect = block.getFieldValue('EFFECT');
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.setSoundEffect('${effect}', ${value});\n`;
    };

    javascriptGenerator.forBlock['sound_cleareffects'] = function () {
        return `await sprite.clearSoundEffects();\n`;
    };

    javascriptGenerator.forBlock['sound_changevolumeby'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VOLUME', Order.ATOMIC) || '0';
        return `await sprite.changeVolume(${value});\n`;
    };

    javascriptGenerator.forBlock['sound_setvolumeto'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VOLUME', Order.ATOMIC) || '0';
        return `await sprite.setVolume(${value});\n`;
    };

    javascriptGenerator.forBlock['sound_volume'] = function () {
        return [`await sprite.getVolume()`, Order.AWAIT];
    };
};
