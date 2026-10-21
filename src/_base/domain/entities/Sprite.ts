/**
 * SpriteData - Modelagem de dados e estado de um Ator (Sprite).
 * 
 * Responsabilidade: Definir a estrutura completa de um ator no ambiente Scratch, 
 * abrangendo propriedades físicas (x, y, ângulo, tamanho), visuais (fantasias) 
 * e lógicas (blocos Blockly e código gerado).
 * 
 * Interfaces:
 * - CostumeData: Representação de uma imagem associada ao ator.
 * - SpriteVariable: Variáveis locais ao escopo do ator.
 * - SpriteData: Agregado principal contendo o estado completo do ator.
 */
import { IBlocklyWorkspaceJson, IBlocklyViewState } from './IBlockly';

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

export type VariableType = 'Number' | 'String' | 'Boolean';
export type VariableValue = string | number | boolean;

export interface SpriteVariable {
    id: string;
    name: string;
    type: VariableType | string; // string mantido para compatibilidade
    value: VariableValue | null;
    isGlobal: boolean;
    ownerId?: string;
    scope?: 'global' | 'local';
    visible?: boolean; // visibilidade do monitor
}

export interface SpriteList {
    id: string;
    name: string;
    items: VariableValue[];
    isGlobal: boolean;
    ownerId?: string;
    visible?: boolean; // visibilidade do monitor de lista
}

export interface SpriteData {
    id: string;
    name: string;
    x: number;
    y: number;
    angle: number;
    size: number;
    visible: boolean;
    isClone?: boolean;
    isStage?: boolean;
    parentId?: string; // ID of the original sprite (if this is a clone)
    rotationStyle: 'all around' | 'left-right' | 'don\'t rotate';
    draggable: boolean;



    width?: number; // Largura real calculada da imagem
    height?: number; // Altura real calculada da imagem
    costume: string | null; // URL or Base64
    costumes: CostumeData[]; // List of costumes
    currentCostumeId: string; // ID of the current costume
    sounds: SoundData[]; // Lista de sons
    currentSoundId: string | null; // ID do som selecionado atualmente
    volume: number; // Volume em porcentagem (0-100)
    soundEffects?: { [key: string]: number }; // Efeitos de som (Pitch, Pan, etc)
    bubbleText: string;
    bubbleType: 'say' | 'think' | null;
    effects?: {
        color: number;
        fisheye: number;
        whirl: number;
        pixelate: number;
        mosaic: number;
        brightness: number;
        ghost: number;
    };
    blocks?: IBlocklyWorkspaceJson; // Blockly JSON
    variables?: SpriteVariable[]; // Explicitly stored variables
    lists?: SpriteList[]; // Listas de dados
    code?: string; // Generated code
    viewState?: IBlocklyViewState; // Visual state of blocks
}
