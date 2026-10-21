/**
 * Agregador de definições de blocos para o modo Placa (Arduino).
 */

import { blockStructure } from "./structure";
import { blockIO } from "./io";
import { blockMotors } from "./motors";
import { blockControl } from "./control";
import { blockSensors } from "./sensors";
import { blockSerial } from "./serial";
import { blockActuators } from "./actuators";
import { blockMath } from "./math";
import { blockMLUpload } from "./ml";
import { blockArtbotUpload } from "./artbot";
import { IBlockDefinition } from "../../../domain/entities";

export const BlockBoardDefinitions: IBlockDefinition[] = [
    ...blockStructure,
    ...blockIO,
    ...blockMotors,
    ...blockControl,
    ...blockSensors,
    ...blockSerial,
    ...blockActuators,
    ...blockMath,
    ...blockMLUpload,
    ...blockArtbotUpload
];
