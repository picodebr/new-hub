/**
 * Geradores de código JavaScript para a categoria de Sensores.
 * 
 * Responsabilidade: Transformar os blocos visuais em chamadas de função 
 * que o motor de execução (StageRunner) possa entender através do sandbox.
 */
import { javascriptGenerator, Order } from 'blockly/javascript';
import * as Blockly from 'blockly/core';

export const initSensingGenerators = () => {
    
    // tocando em [objeto]
    javascriptGenerator.forBlock['sensing_touchingobject'] = function(block: Blockly.Block) {
        const target = block.getFieldValue('TOUCHINGOBJECTMENU');
        const code = `await sprite.isTouching('${target}')`;
        return [code, Order.AWAIT];
    };

    // tocando na cor [cor]
    javascriptGenerator.forBlock['sensing_touchingcolor'] = function(block: Blockly.Block) {
        const colour = block.getFieldValue('COLOUR');
        const code = `await sprite.isTouchingColor('${colour}')`;
        return [code, Order.AWAIT];
    };

    // a cor [cor1] está tocando na cor [cor2]?
    javascriptGenerator.forBlock['sensing_coloristouchingcolor'] = function(block: Blockly.Block) {
        const colour1 = block.getFieldValue('COLOUR1');
        const colour2 = block.getFieldValue('COLOUR2');
        const code = `await sprite.isColorTouchingColor('${colour1}', '${colour2}')`;
        return [code, Order.AWAIT];
    };

    // distância até [objeto]
    javascriptGenerator.forBlock['sensing_distanceto'] = function(block: Blockly.Block) {
        const target = block.getFieldValue('DISTANCETOMENU');
        const code = `await sprite.getDistanceTo('${target}')`;
        return [code, Order.AWAIT];
    };

    // pergunte [pergunta] e espere
    javascriptGenerator.forBlock['sensing_askandwait'] = function(block: Blockly.Block) {
        const question = javascriptGenerator.valueToCode(block, 'QUESTION', Order.NONE) || "''";
        return `await stage.askAndWait(${question});\n`;
    };

    // resposta
    javascriptGenerator.forBlock['sensing_answer'] = function() {
        return [`stage.answer`, Order.MEMBER];
    };

    // tecla [opção] pressionada?
    javascriptGenerator.forBlock['sensing_keypressed'] = function(block: Blockly.Block) {
        const key = block.getFieldValue('KEY_OPTION');
        const code = `stage.isKeyPressed('${key}')`;
        return [code, Order.MEMBER];
    };

    // mouse pressionado?
    javascriptGenerator.forBlock['sensing_mousedown'] = function() {
        return [`stage.isMouseDown()`, Order.FUNCTION_CALL];
    };

    // x do mouse
    javascriptGenerator.forBlock['sensing_mousex'] = function() {
        return [`stage.mouseX`, Order.MEMBER];
    };

    // y do mouse
    javascriptGenerator.forBlock['sensing_mousey'] = function() {
        return [`stage.mouseY`, Order.MEMBER];
    };

    // cronômetro
    javascriptGenerator.forBlock['sensing_timer'] = function() {
        return [`stage.getTimer()`, Order.FUNCTION_CALL];
    };

    // reiniciar cronômetro
    javascriptGenerator.forBlock['sensing_resettimer'] = function() {
        return `stage.resetTimer();\n`;
    };

    // [propriedade] de [objeto]
    javascriptGenerator.forBlock['sensing_of'] = function(block: Blockly.Block) {
        const prop = block.getFieldValue('PROPERTY');
        const target = block.getFieldValue('OBJECT');
        // Usamos await para garantir que o valor seja buscado do estado atual sincronizado
        const code = `await stage.getSpriteProperty('${target}', '${prop}')`;
        return [code, Order.AWAIT];
    };

    // [item] atual
    javascriptGenerator.forBlock['sensing_current'] = function(block: Blockly.Block) {
        const menu = block.getFieldValue('CURRENTMENU');
        const code = `(() => {
            const now = new Date();
            switch('${menu}') {
                case 'YEAR': return now.getFullYear();
                case 'MONTH': return now.getMonth() + 1;
                case 'DATE': return now.getDate();
                case 'DAYOFWEEK': return now.getDay() + 1;
                case 'HOUR': return now.getHours();
                case 'MINUTE': return now.getMinutes();
                case 'SECOND': return now.getSeconds();
                default: return 0;
            }
        })()`;
        return [code, Order.ATOMIC];
    };

    // dias desde 2000
    javascriptGenerator.forBlock['sensing_dayssince2000'] = function() {
        const code = `((Date.now() - new Date(2000, 0, 1).getTime()) / (1000 * 60 * 60 * 24))`;
        return [code, Order.DIVISION];
    };

    // defina modo de arrasto para [modo]
    javascriptGenerator.forBlock['sensing_setdragmode'] = function(block: Blockly.Block) {
        const mode = block.getFieldValue('DRAG_MODE');
        return `sprite.setDraggable(${mode === 'draggable'});\n`;
    };
};

