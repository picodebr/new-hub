/**
 * ISprite - Estruturas de Dados para Atores (Sprites) e Fantasias.
 * 
 * Define a forma como os dados de um ator são armazenados e manipulados no sistema. 
 * Inclui posição (x, y), ângulo, tamanho, visibilidade, balões de fala e, crucialmente, 
 * os blocos do Blockly e o código gerado associado.
 */

export interface CostumeData {
    id: string;
    name: string;
    url: string; // SVG recortado para miniaturas
    stageUrl?: string; // SVG 480x360 com padding para coordenadas do Palco
}

export interface SoundData {
    id: string;
    name: string;
    url: string; // URL ou Base64 do áudio
    format: 'wav' | 'mp3';
    duration?: number;
    sampleRate?: number;
    sampleCount?: number;
}


import { IBlocklyWorkspaceJson, IBlocklyViewState } from './IBlockly';

export type BlocklyJson = IBlocklyWorkspaceJson;


export interface SpriteVariable {
    id: string;
    name: string;
    type: string;
    value: string | number | boolean | null;
    isGlobal: boolean;
    ownerId?: string;
}

export interface SpriteData {
    id: string;
    name: string;
    x: number;
    y: number;
    angle: number;
    size: number;
    rotationStyle: 'all around' | 'left-right' | "don't rotate";
    visible: boolean;
    isClone?: boolean;
    parentId?: string; // ID of the original sprite (if this is a clone)
    costume: string | null; // URL or Base64


    costumes: CostumeData[]; // List of costumes
    currentCostumeId: string; // ID of the current costume
    sounds: SoundData[]; // Lista de sons
    currentSoundId: string | null; // ID do som selecionado
    volume: number; // Volume em porcentagem (0-100)
    soundEffects?: { [key: string]: number }; // Efeitos de som (Pitch, Pan, etc)
    bubbleText: string;
    bubbleType: 'say' | 'think' | null;
    blocks?: BlocklyJson; // Blockly JSON
    variables?: SpriteVariable[]; // Explicitly stored variables
    code?: string; // Generated code
    viewState?: IBlocklyViewState; // Visual state of blocks
}

