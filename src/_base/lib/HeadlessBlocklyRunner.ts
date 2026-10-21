/**
 * HeadlessBlocklyRunner - Executor de Blocos em Segundo Plano.
 * 
 * Esta classe utilitária permite carregar e gerar código para blocos do Blockly 
 * sem a necessidade de uma interface gráfica (workspace visível). É utilizada 
 * principalmente para disparar eventos (Bandeira Verde, Teclas) para atores 
 * que não estão selecionados no momento.
 */
/**
 * Executor do Blockly sem interface gráfica, utilizado para extração de código.
 */
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { IBlocklyWorkspaceJson } from '../domain/entities';

export class HeadlessBlocklyRunner {
    /**
     * Generates code for "When Green Flag Clicked" blocks from a JSON block definition.
     * Uses a headless workspace to load blocks and generate code without UI.
     * @param blocks JSON object representing the blocks (Blockly.serialization)
     * @returns Generated JavaScript code or empty string
     */
    public static getGreenFlagCode(blocks: IBlocklyWorkspaceJson | null): string {
        if (!blocks) return "";

        const headlessWs = new Blockly.Workspace();
        try {
            Blockly.serialization.workspaces.load(blocks as unknown as object, headlessWs);

            // Inicializa Gerador
            // Inicializa Gerador
            const generator = javascriptGenerator as unknown as { init: (ws: Blockly.Workspace) => void };
            if (generator.init) generator.init(headlessWs);

            const topBlocks = headlessWs.getTopBlocks(false);
            let definitions = "";
            let combinedCode = "";

            // 1. Collect Definitions (Custom Blocks & Procedures)
            for (const block of topBlocks) {
                if (block.type === 'procedures_defnoreturn' ||
                    block.type === 'procedures_defreturn' ||
                    block.type.startsWith('custom_def_')) {
                    const defCode = javascriptGenerator.blockToCode(block);
                    if (defCode && typeof defCode === 'string') {
                        definitions += defCode + "\n";
                    }
                }
            }

            // 2. Find and Generate Flag Blocks
            const handlers: string[] = [];
            for (const block of topBlocks) {
                if (block.type === 'when_play_clicked') {
                    const nextBlock = block.getNextBlock();
                    if (nextBlock) {
                        const code = javascriptGenerator.blockToCode(nextBlock);
                        if (code && typeof code === 'string') {
                            handlers.push(`(async () => {\n${code}\n})()`);
                        }
                    }
                }
            }

            if (handlers.length > 0) {
                combinedCode = `await Promise.all([\n  ${handlers.join(',\n  ')}\n]);`;
            }

            return combinedCode ? definitions + "\n" + combinedCode : "";

        } catch (err) {
            console.warn(`[HeadlessRunner] Error generating Green Flag code:`, err);
            return "";
        } finally {
            headlessWs.dispose();
        }
    }

    /**
     * Generates code for "When Key Pressed" blocks matching the given key.
     * @param blocks JSON object representing the blocks
     * @param key The key pressed (e.g. "a", "ArrowUp", " ")
     * @returns Generated JavaScript code or empty string
     */
    public static getKeyPressCode(blocks: IBlocklyWorkspaceJson | null, key: string): string {
        if (!blocks) return "";

        const headlessWs = new Blockly.Workspace();
        try {
            Blockly.serialization.workspaces.load(blocks as unknown as object, headlessWs);

            // Inicializa Gerador
            const generator = javascriptGenerator as unknown as { init: (ws: Blockly.Workspace) => void };
            if (generator.init) generator.init(headlessWs);

            const topBlocks = headlessWs.getTopBlocks(false);
            const handlers: string[] = [];
            let combinedCode = "";

            let definitions = "";
            for (const block of topBlocks) {
                if (block.type === 'procedures_defnoreturn' ||
                    block.type === 'procedures_defreturn' ||
                    block.type.startsWith('custom_def_')) {
                    const defCode = javascriptGenerator.blockToCode(block);
                    if (defCode && typeof defCode === 'string') {
                        definitions += defCode + "\n";
                    }
                }
            }

            for (const block of topBlocks) {
                if (block.type === 'event_when_key_pressed') {
                    const keyOption = block.getFieldValue('KEY_OPTION');

                    // Lógica de Correspondência
                    let isMatch = false;
                    if (keyOption === 'any') isMatch = true;
                    else if (keyOption === key) isMatch = true;
                    // ... (outras condições omitidas no snippet por brevidade, mantendo lógica original)
                    else if (keyOption.toLowerCase() === key.toLowerCase()) isMatch = true;
                    else if (keyOption === "space" && key === " ") isMatch = true;
                    else if (keyOption === "up arrow" && key === "ArrowUp") isMatch = true;
                    else if (keyOption === "down arrow" && key === "ArrowDown") isMatch = true;
                    else if (keyOption === "right arrow" && key === "ArrowRight") isMatch = true;
                    else if (keyOption === "left arrow" && key === "ArrowLeft") isMatch = true;
                    else if (keyOption === "enter" && key === "Enter") isMatch = true;

                    if (isMatch) {
                        const nextBlock = block.getNextBlock();
                        if (nextBlock) {
                            const code = javascriptGenerator.blockToCode(nextBlock);
                            if (code && typeof code === 'string') {
                                handlers.push(`(async () => {\n${code}\n})()`);
                            }
                        }
                    }
                }
            }

            if (handlers.length > 0) {
                combinedCode = `await Promise.all([\n  ${handlers.join(',\n  ')}\n]);`;
            }

            return combinedCode ? definitions + "\n" + combinedCode : "";

        } catch (err) {
            console.warn(`[HeadlessRunner] Error generating Key Press code:`, err);
            return "";
        } finally {
            headlessWs.dispose();
        }
    }

    /**
     * Gera código para blocos "Quando eu receber" que correspondam à mensagem enviada.
     * @param blocks Objeto JSON representando os blocos
     * @param message A mensagem recebida
     * @returns Array de scripts com seus respectivos hatIds.
     */
    public static getMessageCode(blocks: IBlocklyWorkspaceJson | null, message: string): Array<{ hatId: string, code: string }> | null {
        if (!blocks) return null;

        const headlessWs = new Blockly.Workspace();
        try {
            Blockly.serialization.workspaces.load(blocks as unknown as object, headlessWs);

            // Inicializa Gerador
            const generator = javascriptGenerator as unknown as { init: (ws: Blockly.Workspace) => void };
            if (generator.init) generator.init(headlessWs);

            const topBlocks = headlessWs.getTopBlocks(false);
            const scripts: Array<{ hatId: string, code: string }> = [];

            let definitions = "";
            for (const block of topBlocks) {
                if (block.type === 'procedures_defnoreturn' ||
                    block.type === 'procedures_defreturn' ||
                    block.type.startsWith('custom_def_')) {
                    const defCode = javascriptGenerator.blockToCode(block);
                    if (defCode && typeof defCode === 'string') {
                        definitions += defCode + "\n";
                    }
                }
            }

            for (const block of topBlocks) {
                if (block.type === 'quando_receber') {
                    const blockMsg = block.getFieldValue('MENSAGEM');

                    if (blockMsg === message) {
                        const nextBlock = block.getNextBlock();
                        if (nextBlock) {
                            const code = javascriptGenerator.blockToCode(nextBlock);
                            if (code && typeof code === 'string') {
                                scripts.push({
                                    hatId: `broadcast_${message}_${block.id}`,
                                    code: definitions + "\n" + code
                                });
                            }
                        }
                    }
                }
            }

            return scripts.length > 0 ? scripts : null;

        } catch (err) {
            console.warn(`[HeadlessRunner] Erro ao gerar código de mensagem:`, err);
            return null;
        } finally {
            headlessWs.dispose();
        }
    }

    /**
     * Gera código para blocos "Quando o cenário mudar para" que correspondam ao cenário atual.
     * @param blocks Objeto JSON representando os blocos
     * @param backdropName O nome do cenário que foi ativado
     * @returns Array de scripts com seus respectivos hatIds.
     */
    public static getBackdropCode(blocks: IBlocklyWorkspaceJson | null, backdropName: string): Array<{ hatId: string, code: string }> | null {
        if (!blocks) return null;

        const headlessWs = new Blockly.Workspace();
        try {
            Blockly.serialization.workspaces.load(blocks as unknown as object, headlessWs);

            const generator = javascriptGenerator as unknown as { init: (ws: Blockly.Workspace) => void };
            if (generator.init) generator.init(headlessWs);

            const topBlocks = headlessWs.getTopBlocks(false);
            const scripts: Array<{ hatId: string, code: string }> = [];

            let definitions = "";
            for (const block of topBlocks) {
                if (block.type === 'procedures_defnoreturn' ||
                    block.type === 'procedures_defreturn' ||
                    block.type.startsWith('custom_def_')) {
                    const defCode = javascriptGenerator.blockToCode(block);
                    if (defCode && typeof defCode === 'string') {
                        definitions += defCode + "\n";
                    }
                }
            }

            for (const block of topBlocks) {
                if (block.type === 'event_when_backdrop_switches_to') {
                    const blockBackdrop = block.getFieldValue('BACKDROP');

                    if (blockBackdrop === backdropName) {
                        const nextBlock = block.getNextBlock();
                        if (nextBlock) {
                            const code = javascriptGenerator.blockToCode(nextBlock);
                            if (code && typeof code === 'string') {
                                scripts.push({
                                    hatId: `backdrop_${backdropName}_${block.id}`,
                                    code: definitions + "\n" + code
                                });
                            }
                        }
                    }
                }
            }

            return scripts.length > 0 ? scripts : null;

        } catch (err) {
            console.warn(`[HeadlessRunner] Erro ao gerar código de cenário:`, err);
            return null;
        } finally {
            headlessWs.dispose();
        }
    }

    /**
     * Gera código para blocos "Quando eu começar como um clone".

     * @param blocks Objeto JSON representando os blocos
     * @returns Um script com seu respectivo hatId.
     */
    public static getCloneCode(blocks: IBlocklyWorkspaceJson | null): Array<{ hatId: string, code: string }> | null {
        if (!blocks) return null;

        const headlessWs = new Blockly.Workspace();
        try {
            Blockly.serialization.workspaces.load(blocks as unknown as object, headlessWs);

            const generator = javascriptGenerator as unknown as { init: (ws: Blockly.Workspace) => void };
            if (generator.init) generator.init(headlessWs);

            const topBlocks = headlessWs.getTopBlocks(false);
            const scripts: Array<{ hatId: string, code: string }> = [];

            let definitions = "";
            for (const block of topBlocks) {
                if (block.type === 'procedures_defnoreturn' ||
                    block.type === 'procedures_defreturn' ||
                    block.type.startsWith('custom_def_')) {
                    const defCode = javascriptGenerator.blockToCode(block);
                    if (defCode && typeof defCode === 'string') {
                        definitions += defCode + "\n";
                    }
                }
            }

            for (const block of topBlocks) {
                if (block.type === 'control_start_as_clone') {
                    const nextBlock = block.getNextBlock();
                    if (nextBlock) {
                        const code = javascriptGenerator.blockToCode(nextBlock);
                        if (code && typeof code === 'string') {
                            scripts.push({
                                hatId: `clone_start_${block.id}`,
                                code: definitions + "\n" + code
                            });
                        }
                    }
                }
            }

            return scripts.length > 0 ? scripts : null;

        } catch (err) {
            console.warn(`[HeadlessRunner] Erro ao gerar código de clone:`, err);
            return null;
        } finally {
            headlessWs.dispose();
        }
    }

    /**
     * Gera código para blocos "Quando o palco for clicado".
     */
    public static getStageClickCode(blocks: IBlocklyWorkspaceJson | null): Array<{ hatId: string, code: string }> | null {
        if (!blocks) return null;
        const headlessWs = new Blockly.Workspace();
        try {
            Blockly.serialization.workspaces.load(blocks as unknown as object, headlessWs);
            const generator = javascriptGenerator as unknown as { init: (ws: Blockly.Workspace) => void };
            if (generator.init) generator.init(headlessWs);
            const topBlocks = headlessWs.getTopBlocks(false);
            const scripts: Array<{ hatId: string, code: string }> = [];

            let definitions = "";
            for (const block of topBlocks) {
                if (block.type === 'procedures_defnoreturn' ||
                    block.type === 'procedures_defreturn' ||
                    block.type.startsWith('custom_def_')) {
                    const defCode = javascriptGenerator.blockToCode(block);
                    if (defCode && typeof defCode === 'string') {
                        definitions += defCode + "\n";
                    }
                }
            }

            for (const block of topBlocks) {
                if (block.type === 'event_whenstageclicked') {
                    const nextBlock = block.getNextBlock();
                    if (nextBlock) {
                        const code = javascriptGenerator.blockToCode(nextBlock);
                        if (code && typeof code === 'string') {
                            scripts.push({ hatId: `stage_click_${block.id}`, code: definitions + "\n" + code });
                        }
                    }
                }
            }
            return scripts.length > 0 ? scripts : null;
        } catch (err) {
            console.warn(`[HeadlessRunner] Erro ao gerar código de clique no palco:`, err);
            return null;
        } finally {
            headlessWs.dispose();
        }
    }

    /**
     * Gera código para blocos "Quando este ator for clicado".
     */
    public static getSpriteClickCode(blocks: IBlocklyWorkspaceJson | null): Array<{ hatId: string, code: string }> | null {
        if (!blocks) return null;
        const headlessWs = new Blockly.Workspace();
        try {
            Blockly.serialization.workspaces.load(blocks as unknown as object, headlessWs);
            const generator = javascriptGenerator as unknown as { init: (ws: Blockly.Workspace) => void };
            if (generator.init) generator.init(headlessWs);
            const topBlocks = headlessWs.getTopBlocks(false);
            const scripts: Array<{ hatId: string, code: string }> = [];

            let definitions = "";
            for (const block of topBlocks) {
                if (block.type === 'procedures_defnoreturn' ||
                    block.type === 'procedures_defreturn' ||
                    block.type.startsWith('custom_def_')) {
                    const defCode = javascriptGenerator.blockToCode(block);
                    if (defCode && typeof defCode === 'string') {
                        definitions += defCode + "\n";
                    }
                }
            }

            for (const block of topBlocks) {
                if (block.type === 'when_sprite_clicked') {
                    const nextBlock = block.getNextBlock();
                    if (nextBlock) {
                        const code = javascriptGenerator.blockToCode(nextBlock);
                        if (code && typeof code === 'string') {
                            scripts.push({ hatId: `sprite_click_${block.id}`, code: definitions + "\n" + code });
                        }
                    }
                }
            }
            return scripts.length > 0 ? scripts : null;
        } catch (err) {
            console.warn(`[HeadlessRunner] Erro ao gerar código de clique no ator:`, err);
            return null;
        } finally {
            headlessWs.dispose();
        }
    }
}

