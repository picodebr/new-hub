/**
 * Configuração da categoria de Sensores para a toolbox do modo Stage.
 */
import { BlockBuilder, CategoryBuilder, shadowText } from "../../../lib/blockly/BlockBuilder";

export const getCatSensing = (isStage: boolean = false) => {
    const cat = new CategoryBuilder("Sensores", "#5CB1D6");

    if (!isStage) {
        // Toque e Distância (Somente Sprites)
        cat.addBlock(new BlockBuilder('sensing_touchingobject'));
        cat.addBlock(new BlockBuilder('sensing_touchingcolor').withField('COLOUR', '#ff0000'));
        cat.addBlock(new BlockBuilder('sensing_coloristouchingcolor').withField('COLOUR1', '#0000ff').withField('COLOUR2', '#ff0000'));
        cat.addBlock(new BlockBuilder('sensing_distanceto'));
        cat.addBlock(new BlockBuilder('sensing_setdragmode'));
    }

    // Teclado e Mouse
    cat.addBlock(new BlockBuilder('sensing_mousex'));
    cat.addBlock(new BlockBuilder('sensing_mousey'));
    cat.addBlock(new BlockBuilder('sensing_mousedown'));
    cat.addBlock(new BlockBuilder('sensing_keypressed'));

    // Cronômetro
    cat.addBlock(new BlockBuilder('sensing_timer'));
    cat.addBlock(new BlockBuilder('sensing_resettimer'));

    // Pergunta e Resposta
    cat.addBlock(new BlockBuilder('sensing_askandwait')
        .withShadowValue('QUESTION', shadowText('Como você se chama?'))
    );
    cat.addBlock(new BlockBuilder('sensing_answer'));

    // Estado e Tempo
    cat.addBlock(new BlockBuilder('sensing_of').withField('PROPERTY', 'x').withField('OBJECT', '_stage_'));
    cat.addBlock(new BlockBuilder('sensing_current').withField('CURRENTMENU', 'YEAR'));
    cat.addBlock(new BlockBuilder('sensing_dayssince2000'));

    return cat;
};

