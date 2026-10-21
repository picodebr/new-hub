import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';

export const listAvailableUsersForGroupByProject = async (project_class_id: string): Promise<IHubUser[]> => {
  const { data } = await api.get(`/group/available_users/${project_class_id}`);
  return data;
};
