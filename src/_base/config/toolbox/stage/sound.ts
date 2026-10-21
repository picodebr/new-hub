/**
 * Configuração da categoria de Som para a toolbox do modo Stage.
 */
import { BlockBuilder, CategoryBuilder, shadowNum } from "../../../lib/blockly/BlockBuilder";

export const getCatSound = (isStage: boolean = false) => {
    const cat = new CategoryBuilder("Som", "#CF63CF");

    cat.addBlock(new BlockBuilder('sound_playuntildone'));
    cat.addBlock(new BlockBuilder('sound_play'));
    cat.addBlock(new BlockBuilder('sound_stopallsounds'));

    cat.addLabel('Volume');
    cat.addBlock(new BlockBuilder('sound_changevolumeby').withShadowValue('VOLUME', shadowNum(-10)));
    cat.addBlock(new BlockBuilder('sound_setvolumeto').withShadowValue('VOLUME', shadowNum(100)));
    cat.addBlock(new BlockBuilder('sound_volume'));

    return cat;
};
