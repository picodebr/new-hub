import { api } from '@/_base/classes/api';
import { ICreateHubGroupParams, IHubGroup } from '@/_base/interfaces/group';

export const addGroupToProject = async (params: ICreateHubGroupParams): Promise<IHubGroup> => {
  const { data } = await api.post(`/project/group/add`, params);
  return data;
};
