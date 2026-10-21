import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';

export const updateChosenSchoolGroup = async (hub_school_group_id: string): Promise<IHubUser> => {
  const { data } = await api.put('/school_group_choose', { hub_school_group_id });
  return data;
};
