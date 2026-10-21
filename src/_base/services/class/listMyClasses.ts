import { api } from '@/_base/classes/api';
import { IHubClass } from '@/_base/interfaces/class';

export const listMyClasses = async (school_id: string): Promise<IHubClass[]> => {
  const { data } = await api.get(`/class/list/${school_id}`);
  return data;
};
