import IRegisterUser from '@/_base/interfaces/user/IRegisterUser';
import { api } from '@/_base/classes/api';
import { IAuthResponse } from '@/_base/interfaces/auth';

export const signup = async (params: IRegisterUser): Promise<IAuthResponse> => {
  const { data } = await api.post('/register', params);
  return data;
};
