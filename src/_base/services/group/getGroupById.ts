import { api } from '@/_base/classes/api';
import { IHubGroup } from '@/_base/interfaces/group';

export const getGroupById = async (group_id: string): Promise<IHubGroup> => {
  const { data } = await api.get(`/group/${group_id}`);
  return data;
};
