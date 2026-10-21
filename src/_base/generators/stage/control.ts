/**
 * Tradução para JavaScript dos blocos de Movimento (move, turn, goto, glide).
 * 
 * Nota Técnica: Todos os blocos de movimento são assíncronos (await) para 
 * permitir animações suaves e sincronizadas no StageRunner.
 */
/**
 * Tradução para JavaScript dos blocos de Controle e Eventos (loops, condicionais).
 * 
 * Regra Crítica: Injeta 'await stage.yieldFrame()' em loops infinitos ou 
 * repetitivos para sincronizar a execução com a taxa de atualização da tela (60 FPS), 
 * o que evita o travamento da UI e soluciona o jitter de animações antes causado pelo setTimeout.
 */
import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export const initControlGenerators = () => {
    // BLOCOS DE CONTROLE & EVENTOS
    // ==================================================
    javascriptGenerator.forBlock['when_play_clicked'] = function (_block: Blockly.Block) {
        return '';
    };

    javascriptGenerator.forBlock['repete_vezes'] = function (block: Blockly.Block) {
        const times = javascriptGenerator.valueToCode(block, 'TIMES', Order.ATOMIC) || '0';
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        let code = '';
        code += `for (let i = 0; i < ${times}; i++) {\n`;
        code += branch;
        code += `  await stage.yieldFrame();\n`;
        code += `}\n`;
        return code;
    };

    javascriptGenerator.forBlock['repete_sempre'] = function (block: Blockly.Block) {
        const statements = javascriptGenerator.statementToCode(block, 'DO');
        let code = '';
        code += `while(true) {\n`;
        code += statements;
        code += `  await stage.yieldFrame();\n`;
        code += `}\n`;
        return code;
    };

    javascriptGenerator.forBlock['control_wait'] = function (block: Blockly.Block) {
        const seconds = javascriptGenerator.valueToCode(block, 'DURATION', Order.ATOMIC) || '0';
        return `await stage.wait(${seconds});\n`;
    };

    javascriptGenerator.forBlock['wait_block'] = function (block: Blockly.Block) {
        const ms = javascriptGenerator.valueToCode(block, 'TIME', Order.ATOMIC) || '0';
        return `await stage.wait(${ms} / 1000);\n`;
    };

    javascriptGenerator.forBlock['se_entao'] = function (block: Blockly.Block) {
        const cond = javascriptGenerator.valueToCode(block, 'IF0', Order.NONE) || "false";
        const statements = javascriptGenerator.statementToCode(block, 'DO0');
        return `
        if (${cond}) {
            ${statements}
        }
        `;
    };

    javascriptGenerator.forBlock['se_entao_senao'] = function (block: Blockly.Block) {
        const cond = javascriptGenerator.valueToCode(block, 'IF0', Order.NONE) || "false";
        const doCode = javascriptGenerator.statementToCode(block, 'DO0');
        const elseCode = javascriptGenerator.statementToCode(block, 'ELSE');
        return `
        if (${cond}) {
            ${doCode}
        } else {
            ${elseCode}
        }
        `;
    };

    javascriptGenerator.forBlock['event_when_key_pressed'] = function (block: Blockly.Block) {
        const keyOption = block.getFieldValue('KEY_OPTION');
        const nextBlock = block.getNextBlock();
        const branch = javascriptGenerator.blockToCode(nextBlock);
        return `
        stage.registerKeyListener("${keyOption}", async function() {
            ${branch}
        });
        `;
    };

    javascriptGenerator.forBlock['control_wait_until'] = function (block: Blockly.Block) {
        const cond = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
        return `while (!(${cond})) { await yieldFrame(); }\n`;
    };

    javascriptGenerator.forBlock['control_repeat_until'] = function (block: Blockly.Block) {
        const cond = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        return `while (!(${cond})) {\n${branch}  await yieldFrame();\n}\n`;
    };

    javascriptGenerator.forBlock['control_for_each'] = function (block: Blockly.Block) {
        const varId = block.getFieldValue('VAR');
        const listId = block.getFieldValue('LIST');
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        const varRef = `window.__var_${varId}`;
        const listRef = `(window.__list_${listId} || [])`;
        return `for (const __item of ${listRef}) {\n  ${varRef} = __item;\n${branch}  await yieldFrame();\n}\n`;
    };

    javascriptGenerator.forBlock['control_stop'] = function (block: Blockly.Block) {
        const option = block.getFieldValue('STOP_OPTION');
        if (option === 'this script') return `return;\n`;
        if (option === 'all') return `await stage.stopAll();\nreturn;\n`;
        // 'other scripts in sprite' — sem suporte no sandbox
        return ``;
    };

    // BLOCOS DE CLONAGEM (Scratch-like)
    // ==================================================
    javascriptGenerator.forBlock['control_start_as_clone'] = function (_block: Blockly.Block) {
        return ''; // Handled by runner/cloning logic
    };

    javascriptGenerator.forBlock['control_create_clone_of'] = function (block: Blockly.Block) {
        const option = block.getFieldValue('CLONE_OPTION');
        return `await sprite.createClone("${option}");\n`;
    };

    javascriptGenerator.forBlock['control_delete_this_clone'] = function (_block: Blockly.Block) {
        return `await sprite.deleteClone();\n`;
    };
};

