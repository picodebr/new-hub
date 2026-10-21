import { ICreateProjectParams } from '@/_base/interfaces/codeProject/ICreateProjectParams';
import { ICodeProject } from '../../interfaces/codeProject/IProject';
import { api } from '@/_base/classes/api';

type FuncType = (params: ICreateProjectParams) => Promise<ICodeProject>;

export const createCodeProject: FuncType = async (params) => {
  const { data } = await api.post('code/project', params);
  return data;
};
