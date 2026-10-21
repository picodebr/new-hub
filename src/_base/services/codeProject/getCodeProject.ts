import { ICodeProject } from '../../interfaces/codeProject/IProject';
import { api } from '@/_base/classes/api';

type FuncType = (id: string) => Promise<ICodeProject>;

export const getCodeProject: FuncType = async (id) => {
  const { data } = await api.get(`code/project/${id}`);
  return data;
};
