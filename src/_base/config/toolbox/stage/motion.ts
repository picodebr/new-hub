/**
 * Configuração da categoria de Movimento para a toolbox do modo Stage.
 */
import { CategoryBuilder, BlockBuilder, shadowNum } from "../../../lib/blockly/BlockBuilder";

export const getCatMotion = (isStage: boolean = false) => {
    const cat = new CategoryBuilder("Movimento", "#4C97FF");
    
    if (isStage) {
        // O palco não se move no Scratch.
        return cat;
    }

    cat.addBlock(new BlockBuilder('mover').withShadowValue('VALUE', shadowNum(10)));
    cat.addBlock(new BlockBuilder('virar').withField('DIRECAO', 'DIREITA').withShadowValue('GRAUS', shadowNum(90)));
    cat.addBlock(new BlockBuilder('va_para').withField('OPCAO', 'posiAleatoria'));
    cat.addBlock(new BlockBuilder('va_para_X_e_Y').withShadowValue('VALUE_X', shadowNum(0)).withShadowValue('VALUE_Y', shadowNum(0)));
    cat.addBlock(new BlockBuilder('desliza_para').withShadowValue('SECS', shadowNum(1)).withField('OPCAO', 'posiAleatoria'));
    cat.addBlock(new BlockBuilder('desliza_para_X_e_Y').withShadowValue('SECS', shadowNum(1)).withShadowValue('VALUE_X', shadowNum(0)).withShadowValue('VALUE_Y', shadowNum(0)));
    cat.addBlock(new BlockBuilder('aponte_para_direcao').withShadowValue('GRAUS', shadowNum(90)));
    cat.addBlock(new BlockBuilder('aponte_para').withField('OPCAO', 'posiMouse'));
    cat.addBlock(new BlockBuilder('mude_x').withShadowValue('VALUE', shadowNum(10)));
    cat.addBlock(new BlockBuilder('mude_y').withShadowValue('VALUE', shadowNum(10)));
    cat.addBlock(new BlockBuilder('adicionar_x').withShadowValue('VALUE', shadowNum(10)));
    cat.addBlock(new BlockBuilder('adicionar_y').withShadowValue('VALUE', shadowNum(10)));
    cat.addBlock(new BlockBuilder('diminua_x').withShadowValue('VALUE', shadowNum(10)));
    cat.addBlock(new BlockBuilder('diminua_y').withShadowValue('VALUE', shadowNum(10)));
    cat.addBlock(new BlockBuilder('se_tocar_na_borda_volte'));
    cat.addBlock(new BlockBuilder('definir_estilo_rotacao').withField('STYLE', 'LEFT_RIGHT'));
    cat.addBlock(new BlockBuilder('posicao_x'));
    cat.addBlock(new BlockBuilder('posicao_y'));
    cat.addBlock(new BlockBuilder('direcao'));

    return cat;
};

