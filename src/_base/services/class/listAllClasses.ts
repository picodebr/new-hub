import { api } from '@/_base/classes/api';
import { IHubClass } from '@/_base/interfaces/class';

export const listAllClasses = async (school_id: string): Promise<IHubClass[]> => {
  const { data } = await api.get(`/class/list_by_school/${school_id}`);
  return data;
};
