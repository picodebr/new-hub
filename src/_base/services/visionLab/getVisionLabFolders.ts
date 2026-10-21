import { api } from '@/_base/classes/api';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IVisionLabFolder } from '@/_base/interfaces/visionLab/IVisionLabFolder';

type FuncType = () => Promise<IPagingResponse<IVisionLabFolder>>;

export const getVisionLabFolders: FuncType = async () => {
  const { data } = await api.get('/vision_lab/folder');
  return data;
};
