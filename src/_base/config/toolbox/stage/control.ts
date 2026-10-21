/**
 * Configuração da categoria de Controle para a toolbox do modo Stage.
 */
import { BlockBuilder, CategoryBuilder, shadowNum } from "../../../lib/blockly/BlockBuilder";

export const getCatControl = (isStage: boolean = false) => {

    const cat = new CategoryBuilder("Controle", "#FFAB19");

    cat.addBlock(new BlockBuilder('control_wait').withShadowValue('DURATION', shadowNum(1)));
    cat.addBlock(new BlockBuilder('repete_vezes').withShadowValue('TIMES', shadowNum(10)));
    cat.addBlock(new BlockBuilder('repete_sempre'));
    cat.addBlock(new BlockBuilder('se_entao'));
    cat.addBlock(new BlockBuilder('se_entao_senao'));
    cat.addBlock(new BlockBuilder('control_wait_until'));
    cat.addBlock(new BlockBuilder('control_repeat_until'));
    cat.addBlock(new BlockBuilder('control_stop').withField('STOP_OPTION', 'all'));

    if (!isStage) {
        cat.addBlock(new BlockBuilder('control_start_as_clone'));
    }
    
    cat.addBlock(new BlockBuilder('control_create_clone_of').withField('CLONE_OPTION', 'myself'));
    
    if (!isStage) {
        cat.addBlock(new BlockBuilder('control_delete_this_clone'));
    }

    return cat;
};

