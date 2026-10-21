import { api } from '@/_base/classes/api';
import { IVisionLabProject } from '@/_base/interfaces/visionLab/IVisionLabProject';

type FuncType = (id: string) => Promise<IVisionLabProject>;

export const getVisionLabProject: FuncType = async (id: string) => {
  const { data } = await api.get(`/vision_lab/project/${id}`);
  return data;
};
