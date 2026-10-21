import { api } from '@/_base/classes/api';

interface IParams {
  identifier: string;
  token: string;
  password: string;
}

export const recoverPassword = async (params: IParams): Promise<void> => {
  await api.post(`/recover_password`, params);
};
