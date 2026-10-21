import { api } from '@/_base/classes/api';
import { ICorrectorResponse, ISendDailyChallengesParams } from '@/_base/interfaces/challenges';

export interface ISendDailyChallengesResponse {
  passed: boolean;
  finished: boolean;
  coins_earned: number;
  results: ICorrectorResponse[];
}

export const sendDailyChallenges = async (params: ISendDailyChallengesParams): Promise<ISendDailyChallengesResponse> => {
  const { data } = await api.post(`/challenge/daily`, params);
  return data;
};
