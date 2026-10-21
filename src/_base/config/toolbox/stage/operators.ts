/**
 * Configuração da categoria de Operadores para a toolbox do modo Stage.
 */
import { BlockBuilder, CategoryBuilder, shadowNum, shadowText } from "../../../lib/blockly/BlockBuilder";

export const catOperators = new CategoryBuilder("Operadores", "#59C059");

catOperators.addBlock(new BlockBuilder('operator_arithmetic').withField('OP', 'ADD').withShadowValue('NUM1', shadowNum(0)).withShadowValue('NUM2', shadowNum(0)));
catOperators.addBlock(new BlockBuilder('operator_random').withShadowValue('FROM', shadowNum(1)).withShadowValue('TO', shadowNum(10)));
catOperators.addBlock(new BlockBuilder('operator_gt').withShadowValue('OPERAND1', shadowText('')).withShadowValue('OPERAND2', shadowNum(50)));
catOperators.addBlock(new BlockBuilder('operator_lt').withShadowValue('OPERAND1', shadowText('')).withShadowValue('OPERAND2', shadowNum(50)));
catOperators.addBlock(new BlockBuilder('operator_equals').withShadowValue('OPERAND1', shadowText('')).withShadowValue('OPERAND2', shadowNum(50)));
catOperators.addBlock(new BlockBuilder('operator_and'));
catOperators.addBlock(new BlockBuilder('operator_or'));
catOperators.addBlock(new BlockBuilder('operator_not'));
catOperators.addBlock(new BlockBuilder('operator_join').withShadowValue('STRING1', shadowText('alguém ')).withShadowValue('STRING2', shadowText('curtiu')));
catOperators.addBlock(new BlockBuilder('operator_letter_of').withShadowValue('LETTER', shadowNum(1)).withShadowValue('STRING', shadowText('maçã')));
catOperators.addBlock(new BlockBuilder('operator_length').withShadowValue('STRING', shadowText('maçã')));
catOperators.addBlock(new BlockBuilder('operator_contains').withShadowValue('STRING1', shadowText('maçã')).withShadowValue('STRING2', shadowText('a')));
catOperators.addBlock(new BlockBuilder('operator_mod').withShadowValue('NUM1', shadowNum(0)).withShadowValue('NUM2', shadowNum(0)));
catOperators.addBlock(new BlockBuilder('operator_round').withShadowValue('NUM', shadowNum(0)));
catOperators.addBlock(new BlockBuilder('operator_mathop').withShadowValue('NUM', shadowNum(10)));
catOperators.addBlock(new BlockBuilder('operator_map').withShadowValue('VALUE', shadowNum(0)).withShadowValue('FROM_LOW', shadowNum(0)).withShadowValue('FROM_HIGH', shadowNum(1023)).withShadowValue('TO_LOW', shadowNum(0)).withShadowValue('TO_HIGH', shadowNum(100)));
