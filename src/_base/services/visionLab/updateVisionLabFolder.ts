import { api } from '@/_base/classes/api';
import { IVisionLabFolder } from '@/_base/interfaces/visionLab/IVisionLabFolder';

interface IRequest {
  id: string;
  name?: string;
}

type FuncType = (data: IRequest) => Promise<IVisionLabFolder>;

export const updateVisionLabFolder: FuncType = async ({ id, ...dto }) => {
  const { data } = await api.patch(`/vision_lab/folder/${id}`, dto);
  return data;
};
