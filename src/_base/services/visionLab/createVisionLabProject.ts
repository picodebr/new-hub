import { api } from '@/_base/classes/api';
import { IVisionLabProject } from '@/_base/interfaces/visionLab/IVisionLabProject';

interface IRequest {
  folder_id: string;
  name: string;
}

type FuncType = (dto: IRequest) => Promise<IVisionLabProject>;

export const createVisionLabProject: FuncType = async (dto) => {
  const { data } = await api.post('/vision_lab/project', dto);
  return data;
};
