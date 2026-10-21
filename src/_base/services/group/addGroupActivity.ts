import { api } from '@/_base/classes/api';
import { ICreateHubGroupActivityDTO, IHubGroupActivity } from '@/_base/interfaces/group';

export const addGroupActivity = async (params: ICreateHubGroupActivityDTO): Promise<IHubGroupActivity> => {
  const { data } = await api.post(`/group/activity`, params);
  return data;
};
