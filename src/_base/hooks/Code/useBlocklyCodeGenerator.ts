import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { RefObject, useCallback } from 'react';

/**
 * useBlocklyCodeGenerator - Tradutor Visual-para-Código.
 * 
 * Responsabilidade: Transformar a estrutura de blocos do Blockly em código 
 * executável (JavaScript para o Simulador ou C++/Arduino para a Placa). 
 * Gerencia a injeção de dependências como definições de funções customizadas 
 * e a limpeza de nomes de variáveis para evitar conflitos no escopo global.
 */
// Interfaces estendidas para evitar 'any' com propriedades internas ou extras do Blockly
interface ExtendedBlock extends Blockly.Block {
    setHighlighted?: (highlighted: boolean) => void;
}

interface ExtendedGenerator extends Blockly.CodeGenerator {
    nameDB_: Blockly.Names;
    init: (workspace: Blockly.Workspace) => void;
}

const jsGen = javascriptGenerator as unknown as ExtendedGenerator;

/**
 * Helper mais robusto: Lê todas as variáveis diretamente do mapa do Workspace
 * e gera código de inicialização lazy em `window.__var_*`.
 */
function getWorkspaceVarDeclarations(workspace: Blockly.WorkspaceSvg): string {
    let decls = '';
    const allVars = workspace.getVariableMap().getAllVariables();
    for (const variable of allVars) {
        const rawName = (variable as unknown as { name: string }).name || '';
        if (!rawName) continue;
        
        // nameDB_ limpa nomes para evitar conflitos com palavras reservadas do JS.
        const safeName = jsGen.nameDB_
            ? jsGen.nameDB_.getName(rawName, Blockly.Names.NameType.VARIABLE)
            : rawName;
        
        // INICIALIZAÇÃO "LAZY" NO WINDOW:
        // No simulador, as variáveis são persistidas no objeto 'window' para que 
        // mantenham seus valores entre disparos de diferentes eventos (ex: clicar 
        // em várias bandeiras verdes ou teclas). Usamos o prefixo '__var_' para 
        // isolar as variáveis do usuário de propriedades nativas do navegador.
        decls += `if (window.__var_${safeName} === undefined) window.__var_${safeName} = 0;\n`;
    }
    return decls;
}

/**
 * Helper: Prepend variable initializations to code.
 */
function wrapCode(workspace: Blockly.WorkspaceSvg, code: string): string {
    return getWorkspaceVarDeclarations(workspace) + code;
}

export function useBlocklyCodeGenerator(workspaceRef: RefObject<Blockly.WorkspaceSvg | null>, isUploadModeRef: RefObject<boolean>) {

    const checkKeyEvents = useCallback((key: string): string | null => {
        if (!workspaceRef.current || isUploadModeRef.current) return null;

        const workspace = workspaceRef.current;
        if (jsGen.init) jsGen.init(workspace);

        const topBlocks = workspace.getTopBlocks(false);
        let combinedCode = "";

        for (const block of topBlocks) {
            if (block.type === 'event_when_key_pressed') {
                const keyOption = block.getFieldValue('KEY_OPTION');
                let isMatch = false;

                // MAPEAMENTO DE TECLAS: 
                // O Blockly usa labels amigáveis (ex: "space", "up arrow"). 
                // Comparamos com o valor real do 'KeyboardEvent.key' do navegador.
                if (keyOption === key) isMatch = true;
                else if (keyOption && keyOption.toLowerCase() === key.toLowerCase()) isMatch = true;
                else if (keyOption === "space" && key === " ") isMatch = true;
                else if (keyOption === "up arrow" && key === "ArrowUp") isMatch = true;
                else if (keyOption === "down arrow" && key === "ArrowDown") isMatch = true;
                else if (keyOption === "right arrow" && key === "ArrowRight") isMatch = true;
                else if (keyOption === "left arrow" && key === "ArrowLeft") isMatch = true;
                else if (keyOption === "enter" && key === "Enter") isMatch = true;

                if (isMatch) {
                    const extBlock = block as ExtendedBlock;
                    if (extBlock.setHighlighted) {
                        extBlock.setHighlighted(true);
                        setTimeout(() => {
                            if (extBlock.setHighlighted) extBlock.setHighlighted(false);
                        }, 200);
                    }

                    const nextBlock = block.getNextBlock();
                    if (nextBlock) {
                        let funcDefs = "";
                        const allBlocks = workspace.getTopBlocks(false);
                        for (const potentialDef of allBlocks) {
                            if (potentialDef.type.startsWith('custom_def_')) {
                                const defCode = javascriptGenerator.blockToCode(potentialDef);
                                funcDefs += defCode + "\n";
                            }
                        }
                        const code = javascriptGenerator.blockToCode(nextBlock);
                        if (code && typeof code === 'string') {
                            combinedCode += funcDefs + "\n(async () => {\n" + code + "\n})();\n";
                        }
                    }
                }
            }
        }
        if (!combinedCode) return null;
        return wrapCode(workspace, combinedCode);
    }, [workspaceRef, isUploadModeRef]);

    const generateCodeForBlock = useCallback((blockId: string): string | null => {
        if (!workspaceRef.current || isUploadModeRef.current) return null;
        const workspace = workspaceRef.current;
        const clickedBlock = workspace.getBlockById(blockId);
        if (!clickedBlock) return null;

        if (jsGen.init) jsGen.init(workspace);

        // --- COLETA DE DEFINIÇÕES DE FUNÇÕES (igual ao checkGreenFlagEvents) ---
        // Garante que funções customizadas definidas no workspace estejam disponíveis
        // independentemente de qual bloco foi clicado.
        const allTopBlocks = workspace.getTopBlocks(false);
        let funcDefinitions = "";
        for (const b of allTopBlocks) {
            if (b.type === 'procedures_defnoreturn' ||
                b.type === 'procedures_defreturn' ||
                b.type.startsWith('custom_def_')) {
                const defCode = javascriptGenerator.blockToCode(b);
                if (defCode && typeof defCode === 'string') funcDefinitions += defCode + "\n";
            }
        }

        // --- CASO ESPECIAL: Clique direto em um bloco de DEFINIÇÃO de função ---
        // Gera a definição e dispara uma chamada de teste com argumentos padrão.
        if (clickedBlock.type.startsWith('custom_def_')) {
            const defCode = javascriptGenerator.blockToCode(clickedBlock);
            const prototype = clickedBlock.getInputTargetBlock('PROTOTYPE');
            if (prototype) {
                const funcName = prototype.getFieldValue('NAME');
                const safeFuncName = jsGen.nameDB_.getName(funcName, Blockly.Names.NameType.PROCEDURE);
                const args: string[] = [];
                prototype.inputList.forEach(input => {
                    if (input.name.startsWith("ARG_")) {
                        const target = input.connection?.targetBlock();
                        if (target) {
                            if (target.type === 'argument_reporter_number') args.push('0');
                            else if (target.type === 'argument_reporter_boolean') args.push('false');
                            else args.push('""');
                        }
                    }
                });
                return wrapCode(workspace, defCode + "\nawait " + safeFuncName + "(" + args.join(', ') + ");\n");
            }
        }

        // --- LÓGICA PRINCIPAL: Scratch-like block click ---
        // Sobe até o topo do stack (getRootBlock), ignora chapéus (hats) e
        // executa a partir do primeiro bloco de lógica real — exatamente como o Scratch.

        const rootBlock = clickedBlock.getRootBlock();

        // Detecta se o bloco raiz é um chapéu (hat): gera código vazio ou não tem
        // conexão acima (previousConnection === null) e é um bloco disparador.
        // Nesses casos, a execução começa no bloco ABAIXO do chapéu.
        const rootCode = javascriptGenerator.blockToCode(rootBlock);
        const rootCodeStr = Array.isArray(rootCode) ? rootCode[0] : rootCode;
        const isHat = !rootCodeStr || rootCodeStr.trim() === '';

        const startBlock: Blockly.Block | null = isHat
            ? rootBlock.getNextBlock()
            : rootBlock;

        if (!startBlock) return null;

        const rawCode = javascriptGenerator.blockToCode(startBlock);
        const rawCodeStr = Array.isArray(rawCode) ? rawCode[0] : (rawCode as string);
        if (!rawCodeStr) return null;

        // Envolve em IIFE assíncrona para que await funcione corretamente,
        // consistente com checkGreenFlagEvents.
        const fullCode = funcDefinitions + "(async () => {\n" + rawCodeStr + "\n})();\n";
        return wrapCode(workspace, fullCode);
    }, [workspaceRef, isUploadModeRef]);

    const checkGreenFlagEvents = useCallback((): string | null => {
        if (!workspaceRef.current || isUploadModeRef.current) return null;
        const workspace = workspaceRef.current;
        if (jsGen.init) jsGen.init(workspace);

        const topBlocks = workspace.getTopBlocks(false);
        let funcDefinitions = "";
        for (const block of topBlocks) {
            if (block.type === 'procedures_defnoreturn' ||
                block.type === 'procedures_defreturn' ||
                block.type.startsWith('custom_def_')) {
                const defCode = javascriptGenerator.blockToCode(block);
                if (defCode && typeof defCode === 'string') {
                    funcDefinitions += defCode + "\n";
                }
            }
        }

        let combinedCode = "";
        for (const block of topBlocks) {
            if (block.type === 'when_play_clicked') {
                const nextBlock = block.getNextBlock();
                if (nextBlock) {
                    const code = javascriptGenerator.blockToCode(nextBlock);
                    if (code && typeof code === 'string') {
                        combinedCode += `(async () => {\n${code}\n})();\n`;
                    }
                }
            }
        }

        if (!combinedCode) return null;
        return wrapCode(workspace, funcDefinitions + "\n" + combinedCode);
    }, [workspaceRef, isUploadModeRef]);

    const checkMLPredictionEvents = useCallback((className: string): Array<{ hatId: string, code: string }> | null => {
        if (!workspaceRef.current || isUploadModeRef.current) return null;
        const workspace = workspaceRef.current;
        if (jsGen.init) jsGen.init(workspace);

        const topBlocks = workspace.getTopBlocks(false);
        const scripts: Array<{ hatId: string, code: string }> = [];

        for (const block of topBlocks) {
            if (block.type === 'when_ml_predicts') {
                const blockClass = block.getFieldValue('CLASS');
                if (blockClass && blockClass.toLowerCase() === className.toLowerCase()) {
                    const nextBlock = block.getNextBlock();
                    if (nextBlock) {
                        const code = javascriptGenerator.blockToCode(nextBlock);
                        if (code && typeof code === 'string') {
                            scripts.push({
                                hatId: `ml_${className.toLowerCase()}_${block.id}`,
                                code: wrapCode(workspace, code)
                            });
                        }
                    }
                }
            }
        }

        if (scripts.length === 0) return null;
        return scripts;
    }, [workspaceRef, isUploadModeRef]);

    const checkMessageEvents = useCallback((message: string): Array<{ hatId: string, code: string }> | null => {
        if (!workspaceRef.current || isUploadModeRef.current) return null;
        const workspace = workspaceRef.current;
        if (jsGen.init) jsGen.init(workspace);

        const topBlocks = workspace.getTopBlocks(false);
        const scripts: Array<{ hatId: string, code: string }> = [];

        for (const block of topBlocks) {
            if (block.type === 'quando_receber') {
                const blockMessage = block.getFieldValue('MENSAGEM');
                if (blockMessage && blockMessage === message) {
                    const nextBlock = block.getNextBlock();
                    if (nextBlock) {
                        const code = javascriptGenerator.blockToCode(nextBlock);
                        if (code && typeof code === 'string') {
                            scripts.push({
                                hatId: `broadcast_${message}_${block.id}`,
                                code: wrapCode(workspace, code)
                            });
                        }
                    }
                }
            }
        }

        if (scripts.length === 0) return null;
        return scripts;
    }, [workspaceRef, isUploadModeRef]);

    return {
        checkKeyEvents,
        generateCodeForBlock,
        checkGreenFlagEvents,
        checkMLPredictionEvents,
        checkMessageEvents
    };
}
