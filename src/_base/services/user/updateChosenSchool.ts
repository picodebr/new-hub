import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';

export const updateChosenSchool = async (hub_school_id: string): Promise<IHubUser> => {
  const { data } = await api.put('/school_choose', { hub_school_id });
  return data;
};
