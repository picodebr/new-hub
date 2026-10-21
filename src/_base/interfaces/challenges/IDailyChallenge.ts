import { AnswerResultType } from './AnswerResultType';
import { IHubChallenge } from './IHubChallenge';

export interface IDailyChallenge {
  challenges: IHubChallenge[];
  expires_at: number;
  started_at: number;
  finished_at: number | null;
  total_lifes: number;
  daily_lifes: number;
  consecutive_days: number;
  last_activity_day: Date | null;
  answers: Record<number, IDailyChallengeAnswers[]>;
}

export interface IDailyChallengeAnswers extends IHubChallenge {
  passed: boolean;
  earned_coins: number;
}

export interface ISendDailyChallengesParams {
  results: AnswerResultType[];
}

export interface ICorrectorResponse {
  id: string;
  isCorrect: boolean;
  coinsEarned: number;
}
