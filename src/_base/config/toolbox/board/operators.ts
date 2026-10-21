/**
 * Configuração da categoria de Operadores para a toolbox do modo Board.
 */
import { BlockBuilder, CategoryBuilder, shadowNum, shadowText } from "../../../lib/blockly/BlockBuilder";

export const catOperatorsBoard = new CategoryBuilder("Operadores", "#59C059");
catOperatorsBoard.addBlock(new BlockBuilder('math_arithmetic').withShadowValue('A', shadowNum(1)).withShadowValue('B', shadowNum(1)));
catOperatorsBoard.addBlock(new BlockBuilder('logic_compare').withShadowValue('A', shadowText('50')).withShadowValue('B', shadowText('50')));
catOperatorsBoard.addBlock(new BlockBuilder('logic_operation'));
catOperatorsBoard.addBlock(new BlockBuilder('logic_negate'));
catOperatorsBoard.addBlock(new BlockBuilder('logic_boolean'));
catOperatorsBoard.addBlock(new BlockBuilder('math_map')
    .withShadowValue('FROM_LOW', shadowNum(0))
    .withShadowValue('FROM_HIGH', shadowNum(1024))
    .withShadowValue('TO_LOW', shadowNum(0))
    .withShadowValue('TO_HIGH', shadowNum(255))
);
