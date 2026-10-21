import { api } from '@/_base/classes/api';
import { IHubGlobalComment } from '@/_base/interfaces/globalComment';
import { IUpdateProjectAnnotationParams } from '@/_base/interfaces/project';

export const updateProjectAnnotation = async (params: IUpdateProjectAnnotationParams): Promise<IHubGlobalComment> => {
  const { data } = await api.patch(`/project/annotation`, params);
  return data;
};
