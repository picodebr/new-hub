import { api } from '@/_base/classes/api';
import { IHubClass } from '@/_base/interfaces/class';
import { IHubForm } from '@/_base/interfaces/form';

export const getClassData = async (classId: string): Promise<IHubClass & { available_forms: IHubForm[] }> => {
  const { data } = await api.get(`/class/${classId}`);
  return data;
};
