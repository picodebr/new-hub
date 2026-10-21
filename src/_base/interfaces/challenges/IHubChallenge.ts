import { HubModuleLessonType } from '../module';
import { IMazeChallenge } from './IMazeChallenge';
import { IQuizChallenge } from './IQuizChallenge';

export interface IHubChallenge {
  id: string;
  readable_id: number;
  type: HubModuleLessonType;
  grade: string;
  difficulty_level: any;
  title: string;
  description: string;
  data: IHubChallengeData;
  created_at: string;
  updated_at: string;
}

export interface IHubChallengeData {
  quiz_answers?: IQuizChallenge[];
  algorithm_sequence?: string[];
  maze_field?: IMazeChallenge;
}
