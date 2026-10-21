import { api } from '@/_base/classes/api';
import { IAddProjectParams, IProject } from '@/_base/interfaces/project';

export const addProject = async (params: IAddProjectParams): Promise<IProject> => {
  const { data } = await api.post(`/project/add`, params);
  return data;
};
