import { api } from '@/_base/classes/api';
import { IVisionLabFolder } from '@/_base/interfaces/visionLab/IVisionLabFolder';

type FuncType = (name: string) => Promise<IVisionLabFolder>;

export const createVisionLabFolder: FuncType = async (name: string) => {
  const { data } = await api.post('/vision_lab/folder', { name });
  return data;
};
