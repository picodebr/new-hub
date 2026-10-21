import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';

type FuncType = (code: string) => Promise<IHubUser>;

export const addCode: FuncType = async (code) => {
  const { data } = await api.post('/code/add', { code });
  return data;
};
