import { api } from '@/_base/classes/api';
import { IHubGlobalComment } from '@/_base/interfaces/globalComment';
import { IAddProjectAnnotationParams } from '@/_base/interfaces/project';

export const addProjectAnnotation = async (params: IAddProjectAnnotationParams): Promise<IHubGlobalComment> => {
  const { data } = await api.post(`/project/annotation/add`, params);
  return data;
};
