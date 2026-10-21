/**
 * Orquestrador da Caixa de Ferramentas (Toolbox) do Blockly.
 * 
 * Este arquivo é o ponto central que define o que o usuário vê na barra lateral.
 * Ele separa as definições em dois grandes grupos:
 * 1. Stage Mode: Focado em simulação 2D, fantasias e sons.
 * 2. Upload Mode: Focado em hardware, pinos, serial e robótica física.
 * 
 * A montagem é dinâmica: categorias como 'IA' ou 'Placa' só aparecem se 
 * a respectiva extensão estiver ativa no projeto.
 */

import { getCatMotion } from "./stage/motion";
import { getCatLooks } from "./stage/looks";
import { getCatSound } from "./stage/sound";
export { getCatSound };
import { getCatEvents } from "./stage/events";
import { getCatControl } from "./stage/control";
import { getCatSensing } from "./stage/sensing";
import { catOperators } from "./stage/operators";
import { getBoardCategory } from "./stage/board_stage";

import { catOutput, catInput, catSensorsBoard, catSerial, catActuators } from "./board/board";
import { catControlBoard } from "./board/control";
import { catOperatorsBoard } from "./board/operators";
import { catArtbot } from "./board/artbot";

import { catVariables, catLists, catMyBlocks } from "./common/custom";
import { getMachineLearningCategory } from "./common/ml";
import { BlockBuilder, CategoryBuilder } from "../../lib/blockly/BlockBuilder";

/**
 * Função para gerar o toolbox do palco (Stage Mode) dinamicamente.
 */
export const getStageToolbox = (activeExtensions: string[] = [], isStageSelected: boolean = false, hasModel: boolean = false) => {
    const contents = [
        getCatMotion(isStageSelected).toJSON(),
        getCatLooks(isStageSelected).toJSON(),
        getCatSound(isStageSelected).toJSON(),
        getCatEvents(isStageSelected).toJSON(),
        getCatControl(isStageSelected).toJSON(),
        getCatSensing(isStageSelected).toJSON(),
        catOperators.toJSON(),
    ];


    // Variáveis, listas e blocos do usuário
    contents.push(catVariables.toJSON());
    contents.push(catLists.toJSON());
    contents.push(catMyBlocks.toJSON());

    // Extensões dinâmicas (sempre no final)
    if (activeExtensions.includes('piboard')) {
        contents.push(getBoardCategory().toJSON());
    }

    if (activeExtensions.includes('ia')) {
        contents.push(getMachineLearningCategory(hasModel).toJSON());
    }

    return {
        kind: 'categoryToolbox',
        contents
    };
};

/**
 * Definições estáticas mantidas para compatibilidade inicial
 */
export const ToolboxDefinition = getStageToolbox([]);

/**
 * Função para gerar o toolbox de Upload (Placa) dinamicamente.
 */
export const getUploadToolbox = (activeExtensions: string[] = [], hasUploadModel: boolean = false) => {
    const contents: Array<Record<string, unknown> & { kind: string }> = [
        catOutput.toJSON(),
        catInput.toJSON(),
        catSensorsBoard.toJSON(),
        catSerial.toJSON(),
        catActuators.toJSON(),
        catControlBoard.toJSON(),
        catOperatorsBoard.toJSON(),
        catVariables.toJSON(),
        catLists.toJSON(),
        catMyBlocks.toJSON()
    ];

    if (activeExtensions.includes('artbot')) {
        contents.push(catArtbot.toJSON());
    }

    // ML category only when a model is loaded in upload mode
    if (hasUploadModel) {
        const mlCategory = new CategoryBuilder('Vision Lab', '#D94D4D')
            .withIcon('/svg/cerebro.svg')
            .addButton('Trocar Modelo', 'CHANGE_UPLOAD_ML_MODEL')
            .addBlock(new BlockBuilder('ml_upload_on_class'))
            .addBlock(new BlockBuilder('ml_upload_current_class'))
            .addBlock(new BlockBuilder('ml_upload_identified_class'))
            .addBlock(new BlockBuilder('ml_upload_get_confidence'));
        contents.push(mlCategory.toJSON());
    }

    return {
        kind: 'categoryToolbox',
        contents
    };
};

export const ToolboxUploadDefinition = getUploadToolbox([]);
