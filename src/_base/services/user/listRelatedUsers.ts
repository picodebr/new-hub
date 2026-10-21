import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';

export const listRelatedUsers = async (): Promise<IHubUser[]> => {
  const { data } = await api.get(`/list_related`);
  return data;
};
