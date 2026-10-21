import { api } from '@/_base/classes/api';
import { IDailyChallenge } from '@/_base/interfaces/challenges';

export const getDailyChallenges = async (): Promise<IDailyChallenge> => {
  const { data } = await api.get(`/challenge/daily`);
  return data;
};
