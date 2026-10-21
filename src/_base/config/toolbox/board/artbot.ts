/**
 * Configuração da categoria 'Artbot' para a toolbox do modo Board.
 */
import { BlockBuilder, CategoryBuilder } from "../../../lib/blockly/BlockBuilder";

export const catArtbot = new CategoryBuilder('Artbot', '#757575ff')
    .withIcon('/svg/artBot-bloco.svg')
    .addBlock(new BlockBuilder('artbot_move')
        .withShadowField('STEPS', 'math_number', { 'NUM': 1 }))
    .addBlock(new BlockBuilder('artbot_turn')
        .withShadowField('STEPS', 'math_number', { 'NUM': 1 }))
    .addBlock(new BlockBuilder('artbot_action'))
    .addBlock(new BlockBuilder('artbot_dance'))
    .addBlock(new BlockBuilder('artbot_sing'))
    .addBlock(new BlockBuilder('artbot_home'))
    .addBlock(new BlockBuilder('artbot_is_obstacle')
        .withShadowField('DISTANCE', 'math_number', { 'NUM': 15 }));
