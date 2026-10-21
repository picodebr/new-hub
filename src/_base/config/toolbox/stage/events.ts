/**
 * Configuração da categoria de Eventos para a toolbox do modo Stage.
 */
import { BlockBuilder, CategoryBuilder } from "../../../lib/blockly/BlockBuilder";

export const getCatEvents = (isStage: boolean = false) => {
    const cat = new CategoryBuilder("Eventos", "#FFBF00");

    cat.addBlock(new BlockBuilder('when_play_clicked'));
    cat.addBlock(new BlockBuilder('event_when_key_pressed'));

    if (isStage) {
        cat.addBlock(new BlockBuilder('event_whenstageclicked'));
    } else {
        cat.addBlock(new BlockBuilder('when_sprite_clicked'));
    }

    cat.addBlock(new BlockBuilder('event_when_backdrop_switches_to').withField('BACKDROP', 'backdrop1'));
    cat.addBlock(new BlockBuilder('quando_receber'));
    cat.addBlock(new BlockBuilder('transmitir'));
    cat.addBlock(new BlockBuilder('transmitir_e_esperar'));

    return cat;
};

