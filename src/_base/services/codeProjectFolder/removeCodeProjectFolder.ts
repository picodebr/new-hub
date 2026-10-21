import { api } from '@/_base/classes/api';

type FuncType = (id: string) => Promise<void>;

export const removeCodeProjectFolder: FuncType = async (id) => {
  await api.delete(`code/folder/${id}`);
};
