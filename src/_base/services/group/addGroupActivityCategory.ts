import { api } from '@/_base/classes/api';
import { ICreateHubGroupActivityCategoryDTO, IHubGroupActivityCategory } from '@/_base/interfaces/group';

export const addGroupActivityCategory = async (params: ICreateHubGroupActivityCategoryDTO): Promise<IHubGroupActivityCategory> => {
  const { data } = await api.post(`/group/activity_category`, params);
  return data;
};
