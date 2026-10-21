import { api } from '@/_base/classes/api';

interface IParams {
  identifier: string;
  token: string;
}

interface IResponse {
  is_valid: boolean;
  message: string;
}

export const checkRecoveryToken = async (params: IParams): Promise<IResponse> => {
  const { data } = await api.post(`/check_recovery_token`, params);
  return data;
};
