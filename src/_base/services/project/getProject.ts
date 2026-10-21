import { api } from '@/_base/classes/api';
import { IProject } from '@/_base/interfaces/project';

export const getProject = async (project_id: string): Promise<IProject> => {
  const { data } = await api.get(`/project/${project_id}`);
  return data;
};
