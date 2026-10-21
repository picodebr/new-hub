/**
 * Configuração das categorias de Variáveis, Listas e Meus Blocos, compartilhadas entre os modos.
 */
import { CategoryBuilder } from "../../../lib/blockly/BlockBuilder";

export const catVariables = new CategoryBuilder("Variáveis", "#FF8C1A", "CUSTOM_VARIABLE");
export const catLists = new CategoryBuilder("Listas", "#E6821E", "CUSTOM_LIST");
export const catMyBlocks = new CategoryBuilder("Meus Blocos", "#FF6680", "MY_PROCEDURES");
