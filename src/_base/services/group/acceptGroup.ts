import { api } from '@/_base/classes/api';
import { IHubGroup } from '@/_base/interfaces/group';

export const acceptGroup = async (group_id: string): Promise<IHubGroup> => {
  const { data } = await api.post(`/project/group/accept`, { group_id });
  return data;
};
