import { api } from '@/_base/classes/api';
import { IChallengesConfig } from '@/_base/interfaces/challenges/DailyGameConfig';

export const getDailyConfig = async (): Promise<IChallengesConfig> => {
  const { data } = await api.get(`/challenge/daily_config`);
  return data;
};
