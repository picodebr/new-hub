import { api } from '@/_base/classes/api';

type FuncType = (id: string) => Promise<void>;

export const removeCodeProject: FuncType = async (id) => {
  await api.delete(`code/project/${id}`);
};
