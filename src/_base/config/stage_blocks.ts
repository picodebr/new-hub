/**
 * stage_blocks.ts - Agregador de definições para o modo Palco (Stage).
 *
 * Responsabilidade: Consolidar todas as definições JSON de blocos que compõem
 * o ambiente de simulação Scratch-like, facilitando a importação em lote pelo
 * BlockService e garantindo a separação clara do domínio visual.
 */

import { blockMotion } from "./blocks/stage/motion";
import { blockLooks } from "./blocks/stage/looks";
import { blockSound } from "./blocks/stage/sound";
import { blockEvents } from "./blocks/stage/events";
import { blockControl } from "./blocks/stage/control";
import { blockPrimitives } from "./blocks/stage/primitives";
import { blockSensing } from "./blocks/stage/sensing";
import { blockOperators } from "./blocks/stage/operators";
import { blockBoard } from "./blocks/stage/board";
import { blockMachineLearning } from "./blocks/stage/ml";
import { blockVariables } from "./blocks/stage/variables";
import { IBlockDefinition } from "../domain/entities";

export const BlockStageDefinitions: IBlockDefinition[] = [
  ...blockMotion,
  ...blockLooks,
  ...blockSound,
  ...blockEvents,
  ...blockControl,
  ...blockPrimitives,
  ...blockSensing,
  ...blockOperators,
  ...blockBoard,
  ...blockMachineLearning,
  ...blockVariables,
];
