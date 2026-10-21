import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';

export const getProfile = async (): Promise<IHubUser> => {
  const { data } = await api.get(`/profile`);
  return data;
};
