/**
 * Orquestra a inicialização dos geradores de código para o palco (JavaScript).
 */
import { javascriptGenerator, Order } from 'blockly/javascript';
import { initMotionGenerators } from './motion';
import { initLooksGenerators } from './looks';
import { initSoundGenerators } from './sound';
import { initControlGenerators } from './control';
import { initBoardGenerators } from './board';
import { initMathGenerators } from './math';
import { initMLGenerators } from './ml';
import { initVariablesGenerators } from './variables';
import { initEventsGenerators } from './events';
import { initSensingGenerators } from './sensing';
import { initOperatorsGenerators } from './operators';

export const initStageGenerators = () => {
    initMotionGenerators();
    initLooksGenerators();
    initSoundGenerators();
    initControlGenerators();
    initBoardGenerators();
    initMathGenerators();
    initMLGenerators();
    initVariablesGenerators();
    initEventsGenerators();
    initSensingGenerators();
    initOperatorsGenerators();
};

export { javascriptGenerator, Order };
