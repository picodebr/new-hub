import { api } from '@/_base/classes/api';
import { IProjectFolder } from '@/_base/interfaces/codeFolder/IProjectFolder';

type FuncType = (id: string) => Promise<IProjectFolder>;

export const getCodeProjectFolder: FuncType = async (id) => {
  const { data } = await api.get(`code/folder/${id}`);
  return data;
};
