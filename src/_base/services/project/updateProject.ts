import { api } from '@/_base/classes/api';
import { IProject, IUpdateProjectParams } from '@/_base/interfaces/project';

export const updateProject = async ({ id, ...params }: IUpdateProjectParams): Promise<IProject> => {
  const { data } = await api.patch(`/project/${id}`, params);
  return data;
};
