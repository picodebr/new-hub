import { api } from '@/_base/classes/api';
import { IAuthRequest, IAuthResponse } from '@/_base/interfaces/auth';

export const hubLogin = async (credentials: IAuthRequest): Promise<IAuthResponse> => {
  const { data } = await api.post('/session', credentials);
  return data;
};
