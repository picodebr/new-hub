import { ICodeProject } from '../../interfaces/codeProject/IProject';
import { api } from '@/_base/classes/api';

type FuncType = () => Promise<ICodeProject[]>;

export const getCodeProjectsSharedWithMe: FuncType = async () => {
  const { data } = await api.get(`code/project/shared/me`);

  return data;
};
