import { api } from '@/_base/classes/api';
import { IHubGroup } from '@/_base/interfaces/group';

export const removeGroup = async (group_id: string): Promise<IHubGroup> => {
  const { data } = await api.delete(`/project/group/${group_id}`);
  return data;
};
