import { ISendQuizParams } from './IQuizChallenge';
import { ISendAlgorithmParams } from './IAlgorithmChallenge';
import { ISendMazeParams } from './IMazeChallenge';

export type AnswerResultType = ISendQuizParams | ISendAlgorithmParams | (ISendMazeParams & { attempts?: number; time?: number });
