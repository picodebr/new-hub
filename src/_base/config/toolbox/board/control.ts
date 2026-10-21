/**
 * Configuração da categoria de Controle para a toolbox do modo Board.
 */
import { BlockBuilder, CategoryBuilder, shadowNum } from "../../../lib/blockly/BlockBuilder";

export const catControlBoard = new CategoryBuilder("Controle", "#FFBF00");
catControlBoard.addBlock(new BlockBuilder('wait_block').withShadowValue('TIME', shadowNum(500)));
catControlBoard.addBlock(new BlockBuilder('if_block'));
catControlBoard.addBlock(new BlockBuilder('if_else_block'));
catControlBoard.addBlock(new BlockBuilder('repeat_block').withShadowValue('TIMES', shadowNum(10)));
catControlBoard.addBlock(new BlockBuilder('while_block'));
catControlBoard.addBlock(new BlockBuilder('forever_block'));
