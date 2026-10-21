import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';
import IUpdateProfile from '@/_base/interfaces/user/IUpdateProfile';

export const updateProfile = async (params: IUpdateProfile): Promise<IHubUser> => {
  const { data } = await api.patch('/me', params);
  return data;
};
