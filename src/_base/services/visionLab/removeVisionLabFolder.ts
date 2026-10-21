import { api } from '@/_base/classes/api';

type FuncType = (id: string) => Promise<void>;

export const removeVisionLabFolder: FuncType = async (id: string) => {
  await api.delete(`/vision_lab/folder/${id}`);
};
