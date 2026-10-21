import { IChallengesConfig } from './DailyGameConfig';
import { IDailyChallenge } from './IDailyChallenge';

export interface DailyGameProps extends IDailyChallenge {
  currentIndex: number;
  remainingLifes: number;
  averageResponse?: number;
  config?: IChallengesConfig;
}
