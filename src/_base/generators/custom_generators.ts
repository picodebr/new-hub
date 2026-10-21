/**
 * custom_generators.ts - Tradução de blocos dinâmicos para JS e C++.
 * 
 * Responsabilidade: Implementar a lógica de geração de código para blocos 
 * que não possuem geradores estáticos, especialmente procedimentos criados 
 * pelo usuário e blocos de reporters de argumentos, garantindo paridade entre 
 * o Palco e a Placa.
 * 
 * Operações Principais:
 * - initCustomGenerators: Configuração inicial dos mapeamentos e overrides de scrub.
 * - registerDynamicGenerator: Criação "on-the-fly" de geradores para novas 
 *   funções, injetando parâmetros e tipos de dados corretos.
 */

import { javascriptGenerator, Order } from './stage/index';
import { arduinoGenerator, Order as ArduinoOrder } from './board';
import * as Blockly from 'blockly/core';

// Interfaces estendidas para acessar propriedades internas dos geradores do Blockly
interface ExtendedGenerator extends Blockly.CodeGenerator {
    nameDB_?: Blockly.Names;
    scrub_: (block: Blockly.Block, code: string, opt_thisOnly: boolean) => string;
}

const jsGen = javascriptGenerator as unknown as ExtendedGenerator;
const ardGen = arduinoGenerator as unknown as ExtendedGenerator;

// Helper para obter NameDB de forma segura - Movido para nível de módulo para compartilhamento
const getArduinoNameDB = () => {
    if (!ardGen.nameDB_) {
        ardGen.nameDB_ = new Blockly.Names((arduinoGenerator as unknown as { RESERVED_WORDS_: string }).RESERVED_WORDS_ || '');
    }
    return ardGen.nameDB_;
};

// Inicializar geradores estáticos (Reporters) e configurar overrides
export const initCustomGenerators = () => {

    // --- JAVASCRIPT GENERATORS ---
    // 1. Reporters (String/Number/Bool)
    javascriptGenerator.forBlock['argument_reporter_string'] = function (block: Blockly.Block) {
        const code = block.getFieldValue('VALUE');
        const name = jsGen.nameDB_!.getName(code, Blockly.Names.NameType.VARIABLE);
        return [name, Order.ATOMIC];
    };

    javascriptGenerator.forBlock['argument_reporter_number'] = function (block: Blockly.Block) {
        const code = block.getFieldValue('VALUE');
        const name = jsGen.nameDB_!.getName(code, Blockly.Names.NameType.VARIABLE);
        return [name, Order.ATOMIC];
    };

    javascriptGenerator.forBlock['argument_reporter_boolean'] = function (block: Blockly.Block) {
        const code = block.getFieldValue('VALUE');
        const name = jsGen.nameDB_!.getName(code, Blockly.Names.NameType.VARIABLE);
        return [name, Order.ATOMIC];
    };

    // 2. Sobrescrever scrub_
    const jsOldScrub = jsGen.scrub_;
    jsGen.scrub_ = function (block: Blockly.Block, code: string, opt_thisOnly: boolean) {
        if (block.type && block.type.startsWith('custom_def_')) {
            return code;
        }
        return jsOldScrub.call(this, block, code, opt_thisOnly);
    };


    // --- ARDUINO GENERATORS ---
    // 1. Reporters
    arduinoGenerator.forBlock['argument_reporter_string'] = function (block: Blockly.Block) {
        const code = block.getFieldValue('VALUE');
        const name = getArduinoNameDB().getName(code, Blockly.Names.NameType.VARIABLE);
        return [name, ArduinoOrder.ATOMIC];
    };

    arduinoGenerator.forBlock['argument_reporter_number'] = function (block: Blockly.Block) {
        const code = block.getFieldValue('VALUE');
        const name = getArduinoNameDB().getName(code, Blockly.Names.NameType.VARIABLE);
        return [name, ArduinoOrder.ATOMIC];
    };

    arduinoGenerator.forBlock['argument_reporter_boolean'] = function (block: Blockly.Block) {
        const code = block.getFieldValue('VALUE');
        const name = getArduinoNameDB().getName(code, Blockly.Names.NameType.VARIABLE);
        return [name, ArduinoOrder.ATOMIC];
    };

    // 2. Sobrescrever scrub_ para Arduino
    const ardOldScrub = ardGen.scrub_;
    ardGen.scrub_ = function (block: Blockly.Block, code: string, opt_thisOnly: boolean) {
        if (block.type && block.type.startsWith('custom_def_')) {
            return code;
        }
        return ardOldScrub.call(this, block, code, opt_thisOnly);
    };

};


// Registrar Gerador Dinâmico para uma Definição e Chamada de função específica
export const registerDynamicGenerator = (
    defBlockType: string,
    callBlockType: string,
    funcName: string,
    args: { type: string, value: string }[]
) => {

    // --- JAVASCRIPT GENERATION ---
    javascriptGenerator.forBlock[defBlockType] = function (block: Blockly.Block) {
        const nameDB = jsGen.nameDB_!;
        const safeFuncName = nameDB.getName(funcName, Blockly.Names.NameType.PROCEDURE);

        const prototype = block.getInputTargetBlock('PROTOTYPE');
        const realArgs: string[] = [];

        if (prototype) {
            prototype.inputList.forEach(input => {
                if (input.name.startsWith("ARG_")) {
                    const target = input.connection?.targetBlock();
                    if (target) {
                        const val = target.getFieldValue('VALUE');
                        realArgs.push(jsGen.nameDB_!.getName(val, Blockly.Names.NameType.VARIABLE));
                    }
                }
            });
        }

        const nextBlock = block.getNextBlock();
        let branch = '';
        if (nextBlock) {
            branch = javascriptGenerator.blockToCode(nextBlock) as string;
        }

        const argsList = realArgs.join(', ');
        return `async function ${safeFuncName} (${argsList}) { \n${branch} \n } \n`;
    };

    javascriptGenerator.forBlock[callBlockType] = function (block: Blockly.Block) {
        const nameDB = jsGen.nameDB_!;
        const safeFuncName = nameDB.getName(funcName, Blockly.Names.NameType.PROCEDURE);

        const generatedArgs: string[] = [];
        args.forEach((arg, i) => {
            if (arg.type !== 'label') {
                let defaultVal = "'null'";
                if (arg.type === 'input') defaultVal = "'0'";
                else if (arg.type === 'number') defaultVal = "0";
                else if (arg.type === 'bool') defaultVal = "false";

                const code = javascriptGenerator.valueToCode(block, "ARG_" + i, Order.COMMA) || defaultVal;
                generatedArgs.push(code);
            }
        });

        return `await ${safeFuncName}(${generatedArgs.join(', ')});\n`;
    };


    // --- ARDUINO GENERATION ---
    arduinoGenerator.forBlock[defBlockType] = function (block: Blockly.Block) {
        const safeFuncName = getArduinoNameDB().getName(funcName, Blockly.Names.NameType.PROCEDURE);

        const prototype = block.getInputTargetBlock('PROTOTYPE');
        const argParams: string[] = [];

        if (prototype) {
            args.forEach((argSpec, i) => {
                if (argSpec.type !== 'label') {
                    const input = prototype.getInput("ARG_" + i);
                    if (input) {
                        const target = input.connection?.targetBlock();
                        if (target) {
                            const val = target.getFieldValue('VALUE');
                            const safeArgName = getArduinoNameDB().getName(val, Blockly.Names.NameType.VARIABLE);

                            let type = "float"; // Padrão para número
                            if (argSpec.type === 'input') type = "String";
                            else if (argSpec.type === 'bool') type = "bool";

                            argParams.push(`${type} ${safeArgName}`);
                        }
                    }
                }
            });
        }

        const nextBlock = block.getNextBlock();
        let branch = '';
        if (nextBlock) {
            branch = arduinoGenerator.blockToCode(nextBlock) as string;
        }

        const funcSignature = `void ${safeFuncName}(${argParams.join(', ')})`;
        const funcCode = `${funcSignature} {\n${branch}\n}`;

        // Registra definição da função
        const definitions = (arduinoGenerator as unknown as { definitions_: Record<string, string> }).definitions_;
        if (definitions) {
            definitions[safeFuncName] = funcCode;
        }

        return ""; // Retorna string vazia para não aparecer no loop()
    };


    arduinoGenerator.forBlock[callBlockType] = function (block: Blockly.Block) {
        const safeFuncName = getArduinoNameDB().getName(funcName, Blockly.Names.NameType.PROCEDURE);

        const generatedArgs: string[] = [];
        args.forEach((arg, i) => {
            if (arg.type !== 'label') {
                let defaultVal = "0";
                if (arg.type === 'input') defaultVal = '""';
                else if (arg.type === 'bool') defaultVal = "false";

                const code = arduinoGenerator.valueToCode(block, "ARG_" + i, ArduinoOrder.COMMA) || defaultVal;
                generatedArgs.push(code);
            }
        });

        return `${safeFuncName}(${generatedArgs.join(', ')});\n`;
    };

};
