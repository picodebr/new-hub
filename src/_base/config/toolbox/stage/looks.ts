/**
 * Configuração da categoria de Aparência para a toolbox do modo Stage.
 */
import { BlockBuilder, CategoryBuilder, shadowNum, shadowText } from "../../../lib/blockly/BlockBuilder";

export const getCatLooks = (isStage: boolean = false) => {
    const cat = new CategoryBuilder("Aparência", "#9966FF");

    if (!isStage) {
        cat.addBlock(new BlockBuilder('looks_say_for_secs').withShadowValue('MESSAGE', shadowText('Olá!')).withShadowValue('SECS', shadowNum(2)));
        cat.addBlock(new BlockBuilder('looks_say').withShadowValue('MESSAGE', shadowText('Olá!')));
        cat.addBlock(new BlockBuilder('looks_think_for_secs').withShadowValue('MESSAGE', shadowText('Hmm...')).withShadowValue('SECS', shadowNum(2)));
        cat.addBlock(new BlockBuilder('looks_think').withShadowValue('MESSAGE', shadowText('Hmm...')));
        cat.addBlock(new BlockBuilder('looks_set_size').withShadowValue('SIZE', shadowNum(100)));
        cat.addBlock(new BlockBuilder('looks_change_size').withShadowValue('CHANGE', shadowNum(10)));
        cat.addBlock(new BlockBuilder('looks_show'));
        cat.addBlock(new BlockBuilder('looks_hide'));
    }

    // Blocos de cenário (Backdrop) - Prioritários para o palco
    cat.addBlock(new BlockBuilder('looks_switch_backdrop').withField('BACKDROP', 'NEXT'));
    cat.addBlock(new BlockBuilder('looks_switchbackdroptoandwait').withField('BACKDROP', 'NEXT'));
    cat.addBlock(new BlockBuilder('looks_next_backdrop'));

    if (!isStage) {
        cat.addBlock(new BlockBuilder('looks_switch_costume').withField('COSTUME', 'NEXT'));
        cat.addBlock(new BlockBuilder('looks_next_costume'));
        cat.addBlock(new BlockBuilder('looks_gotofrontback').withField('FRONT_BACK', 'front'));
        cat.addBlock(new BlockBuilder('looks_goforwardbackwardlayers').withField('FORWARD_BACKWARD', 'forward').withShadowValue('NUM', shadowNum(1)));
        cat.addBlock(new BlockBuilder('looks_costumenumbername').withField('NUMBER_NAME', 'number'));
    }

    cat.addBlock(new BlockBuilder('looks_backdropnumbername').withField('NUMBER_NAME', 'number'));

    if (!isStage) {
        cat.addBlock(new BlockBuilder('looks_size'));
    }

    return cat;
};
