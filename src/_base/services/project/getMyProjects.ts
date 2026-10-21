import { api } from '@/_base/classes/api';
import { IProject } from '@/_base/interfaces/project';

export const getMyProjects = async (school_id: string): Promise<IProject[]> => {
  const { data } = await api.get(`/project/me/${school_id}`);

  return data;
};
