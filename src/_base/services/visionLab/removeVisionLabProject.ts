import { api } from '@/_base/classes/api';

type FuncType = (id: string) => Promise<void>;

export const removeVisionLabProject: FuncType = async (id: string) => {
  await api.delete(`/vision_lab/project/${id}`);
};
