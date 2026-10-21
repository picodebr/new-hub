/**
 * Tradução para JavaScript dos blocos de Movimento (move, turn, goto, glide).
 */
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const initMotionGenerators = () => {
    // BLOCOS DE MOVIMENTO
    // ==================================================
    javascriptGenerator.forBlock['mover'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.move(${value});\n`;
    };

    javascriptGenerator.forBlock['virar'] = function (block: Blockly.Block) {
        const direcao = block.getFieldValue('DIRECAO');
        const grau = javascriptGenerator.valueToCode(block, 'GRAUS', Order.ATOMIC) || '0';
        let valorFinal;
        if (direcao === "DIREITA") {
            valorFinal = grau;
        } else {
            valorFinal = `(-1 * (${grau}))`;
        }
        return `await sprite.turn(${valorFinal});\n`;
    };

    javascriptGenerator.forBlock['va_para_X_e_Y'] = function (block: Blockly.Block) {
        const value_x = javascriptGenerator.valueToCode(block, 'VALUE_X', Order.ATOMIC) || '0';
        const value_y = javascriptGenerator.valueToCode(block, 'VALUE_Y', Order.ATOMIC) || '0';
        return `sprite.goTo(${value_x}, ${value_y});\n`;
    };

    javascriptGenerator.forBlock['aponte_para_direcao'] = function (block: Blockly.Block) {
        const graus = javascriptGenerator.valueToCode(block, 'GRAUS', Order.ATOMIC) || '0';
        return `sprite.setAngle(${graus});\n`;
    }

    javascriptGenerator.forBlock['mude_x'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.setX(${value});\n`;
    };

    javascriptGenerator.forBlock['mude_y'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.setY(${value});\n`;
    };

    javascriptGenerator.forBlock['adicionar_y'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.addY(${value});\n`;
    };

    javascriptGenerator.forBlock['adicionar_x'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.addX(${value});\n`;
    };

    javascriptGenerator.forBlock['diminua_y'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.addY(-(${value}));\n`;
    };

    javascriptGenerator.forBlock['diminua_x'] = function (block: Blockly.Block) {
        const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
        return `await sprite.addX(-(${value}));\n`;
    };

    javascriptGenerator.forBlock['va_para'] = function (block: Blockly.Block) {
        const dropdown_direcao = block.getFieldValue('OPCAO');
        let code = '';
        if (dropdown_direcao === 'posiAleatoria') {
            code = `
            (function() {
            const limitX = 240;
            const limitY = 180;
            const randX = Math.floor(Math.random() * (limitX * 2 + 1)) - limitX;
            const randY = Math.floor(Math.random() * (limitY * 2 + 1)) - limitY;
            sprite.goTo(randX, randY);
            })();\n`;
        } else if (dropdown_direcao === 'posiMouse') {
            code = `sprite.goToMouse();\n`;
        }
        return code;
    };

    javascriptGenerator.forBlock['aponte_para'] = function (block: Blockly.Block) {
        const dropdown_opcao = block.getFieldValue('OPCAO');
        if (dropdown_opcao === 'posiMouse') {
            return 'sprite.pointToMouse();\n';
        }
        return '';
    };

    javascriptGenerator.forBlock['se_tocar_na_borda_volte'] = function (_block: Blockly.Block) {
        return `await sprite.bounceOnEdge();\n`;
    };

    javascriptGenerator.forBlock['desliza_para'] = function (block: Blockly.Block) {
        const secs = javascriptGenerator.valueToCode(block, 'SECS', Order.ATOMIC) || '1';
        const dropdown_opcao = block.getFieldValue('OPCAO');
        let code = '';
        if (dropdown_opcao === 'posiAleatoria') {
            code = `
            await (async () => {
                const limitX = 240;
                const limitY = 180;
                const randX = Math.floor(Math.random() * (limitX * 2 + 1)) - limitX;
                const randY = Math.floor(Math.random() * (limitY * 2 + 1)) - limitY;
                await sprite.glide(${secs}, randX, randY);
            })();\n`;
        } else if (dropdown_opcao === 'posiMouse') {
            code = `await sprite.glide(${secs}, stage.mouseX, stage.mouseY);\n`;
        }
        return code;
    };

    javascriptGenerator.forBlock['desliza_para_X_e_Y'] = function (block: Blockly.Block) {
        const secs = javascriptGenerator.valueToCode(block, 'SECS', Order.ATOMIC) || '1';
        const x = javascriptGenerator.valueToCode(block, 'VALUE_X', Order.ATOMIC) || '0';
        const y = javascriptGenerator.valueToCode(block, 'VALUE_Y', Order.ATOMIC) || '0';
        return `await sprite.glide(${secs}, ${x}, ${y});\n`;
    };

    javascriptGenerator.forBlock['definir_estilo_rotacao'] = function (block: Blockly.Block) {
        const style = block.getFieldValue('STYLE');
        return `sprite.setRotationStyle('${style}');\n`;
    };

    javascriptGenerator.forBlock['posicao_x'] = function (_block: Blockly.Block) {
        return [`(await sprite.getX())`, Order.AWAIT];
    };

    javascriptGenerator.forBlock['posicao_y'] = function (_block: Blockly.Block) {
        return [`(await sprite.getY())`, Order.AWAIT];
    };

    javascriptGenerator.forBlock['direcao'] = function (_block: Blockly.Block) {
        return [`(await sprite.getAngle())`, Order.AWAIT];
    };
};
