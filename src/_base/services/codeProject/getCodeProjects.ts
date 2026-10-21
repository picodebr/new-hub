import { IPagingResponse } from '@/_base/interfaces/shared';
import { ICodeProject } from '../../interfaces/codeProject/IProject';
import { api } from '@/_base/classes/api';

type FuncType = () => Promise<IPagingResponse<ICodeProject>>;

export const getCodeProjects: FuncType = async () => {
  const { data } = await api.get(`code/projects`);

  return data;
};
