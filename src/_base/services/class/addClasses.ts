import { api } from '@/_base/classes/api';
import { IHubClass } from '@/_base/interfaces/class';

export const addClasses = async (body: { class_ids: string[] }): Promise<IHubClass[]> => {
  const { data } = await api.post(`/class/add`, body);
  return data;
};
