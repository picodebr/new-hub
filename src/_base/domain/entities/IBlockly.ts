/**
 * Contratos e interfaces para integração com o Blockly.
 * Define a estrutura de Workspaces, Blocos, Toolboxes e ViewState.
 */
import * as Blockly from 'blockly/core';

export interface IBlocklyBlock {
    type: string;
    id?: string;
    x?: number;
    y?: number;
    fields?: Record<string, unknown>;
    inputs?: Record<string, { block?: IBlocklyBlock; shadow?: IBlocklyBlock }>;
    next?: { block: IBlocklyBlock };
    extraState?: unknown;
    mutation?: unknown;
}

export interface IBlocklyWorkspaceJson {
    blocks: {
        languageVersion: number;
        blocks: IBlocklyBlock[];
    };
    variables?: Array<{
        name: string;
        id: string;
        type: string;
    }>;
}

export interface IBlockDefinition {
    type: string;
    message0?: string;
    args0?: Array<{
        type: string;
        name?: string;
        check?: string | string[];
        options?: Array<[string, string]> | string[][];
        src?: string;
        width?: number;
        height?: number;
        alt?: string;
        flipRtl?: boolean;
    } | string>;
    lastDummyAlign0?: string;
    message1?: string;
    args1?: unknown[];
    lastDummyAlign1?: string;
    previousStatement?: string | string[] | boolean | null;
    nextStatement?: string | string[] | boolean | null;
    style?: string;
    tooltip?: string;
    helpUrl?: string;
    output?: string | string[] | boolean | null;
    colour?: string | number;
    inputsInline?: boolean;
    extensions?: string[];
    mutator?: string;
}

export interface IToolboxDefinition {
    kind: string;
    contents: Array<{
        kind: string;
        name?: string;
        categorystyle?: string;
        contents?: Array<{
            kind: string;
            type?: string;
            blockxml?: string;
            gap?: number;
        }>;
    }>;
}

export interface IBlocklyViewState {
    x: number;
    y: number;
    scale: number;
}

/**
 * Interface exposta via forwardRef para permitir que componentes pais interajam com o workspace.
 */
export interface BlocklyWorkspaceRef {
    checkKeyEvents: (key: string) => string | null;
    generateCodeForBlock: (blockId: string) => string | null;
    checkGreenFlagEvents: () => string | null;
    checkMLPredictionEvents: (className: string) => Array<{ hatId: string, code: string }> | null;
    checkMessageEvents: (message: string) => Array<{ hatId: string, code: string }> | null;
    checkBackdropEvents: (backdropName: string) => Array<{ hatId: string, code: string }> | null;
    checkStageClickEvents: () => Array<{ hatId: string, code: string }> | null;
    checkSpriteClickEvents: (spriteId: string) => Array<{ hatId: string, code: string }> | null;
    setBlockHighlight: (blockId: string, highlighted: boolean) => void;
    flushActiveWorkspace: () => void;

    undo: () => void;
    redo: () => void;
    getWorkspace: () => Blockly.WorkspaceSvg | null;
}

/**
 * Extensões auxiliares para lidar com propriedades customizadas do Blockly no projeto
 * sem recorrer ao uso frequente de 'any'.
 */
export interface ExtendedWorkspace extends Blockly.WorkspaceSvg {
    disposed?: boolean;
    getFlyoutScale?: () => number;
    getParent?: () => ExtendedWorkspace | null;
    getToolbox: () => ExtendedToolbox | null;
    isFlyout: boolean;
}

export interface ExtendedToolbox extends Blockly.IToolbox {
    getFlyout: () => ExtendedFlyout | null;
}

export interface ExtendedFlyout extends Blockly.IFlyout {
    getFlyoutScale?: () => number;
    getWidth: () => number;
    getWorkspace: () => ExtendedWorkspace;
    scrollbar_?: {
        svgGroup_?: HTMLElement;
    };
}

export interface ExtendedBlock extends Blockly.BlockSvg {
    getSvgRoot: () => SVGGElement;
}

/**
 * Interface para o estado global de sensores (Mestre para Sandboxes).
 */
export interface SensingState {
    type: 'UPDATE_SENSORS_STATE';
    keys: Record<string, boolean>;
    mouseDown: boolean;
    mouseX: number;
    mouseY: number;
    timer: number;
    answer: string | null;
}
