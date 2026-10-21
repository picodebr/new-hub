import { api } from '@/_base/classes/api';
import { ICreateCodeProjectFolderParams } from '@/_base/interfaces/codeFolder/ICreateProjectFolderParams';
import { IProjectFolder } from '@/_base/interfaces/codeFolder/IProjectFolder';

type FuncType = (params: ICreateCodeProjectFolderParams) => Promise<IProjectFolder>;

export const createCodeProjectFolder: FuncType = async (params) => {
  const { data } = await api.post('code/folder', params);
  return data;
};
