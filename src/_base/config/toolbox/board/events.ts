/**
 * Configuração da categoria de Eventos para a toolbox do modo Board.
 */
import { BlockBuilder, CategoryBuilder } from "../../../lib/blockly/BlockBuilder";

export const catEventsBoard = new CategoryBuilder("Sistema", "#FFBF00")
    .addBlock(new BlockBuilder('setup_block'))
    .addBlock(new BlockBuilder('loop_block'));
