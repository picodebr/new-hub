import { api } from '@/_base/classes/api';
import { IHubGroup, IUpdateHubGroupParams } from '@/_base/interfaces/group';

export const updateGroup = async ({ id, ...params }: IUpdateHubGroupParams): Promise<IHubGroup> => {
  const { data } = await api.patch(`/group/${id}`, params);
  return data;
};
