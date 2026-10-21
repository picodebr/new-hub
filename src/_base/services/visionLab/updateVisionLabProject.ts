import { api } from '@/_base/classes/api';
import { IVisionLabFolder } from '@/_base/interfaces/visionLab/IVisionLabFolder';

interface IRequest {
  id: string;
  name?: string;
  labels?: string[];
  bin_path?: string;
  model_path?: string;
}

type FuncType = (dto: IRequest) => Promise<IVisionLabFolder>;

export const updateVisionLabProject: FuncType = async ({ id, ...dto }) => {
  const { data } = await api.patch(`/vision_lab/project/${id}`, dto);
  return data;
};
