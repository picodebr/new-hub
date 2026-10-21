import { api } from '@/_base/classes/api';
import { IVisionLabFolder } from '@/_base/interfaces/visionLab/IVisionLabFolder';

type FuncType = (id: string) => Promise<IVisionLabFolder>;

export const getVisionLabFolder: FuncType = async (id: string) => {
  const { data } = await api.get(`/vision_lab/folder/${id}`);
  return data;
};
