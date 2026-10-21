import { ICreateProjectParams } from '@/_base/interfaces/codeProject/ICreateProjectParams';
import { ICodeProject } from '../../interfaces/codeProject/IProject';
import { api } from '@/_base/classes/api';

interface IUpdateCodeProject extends Partial<ICreateProjectParams> {
  id: string;
}

type FuncType = (params: IUpdateCodeProject) => Promise<ICodeProject>;

export const updateCodeProject: FuncType = async ({ id, ...params }) => {
  const { data } = await api.patch(`code/project/${id}`, params);
  return data;
};
