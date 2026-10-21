import { ICodeProject } from '../../interfaces/codeProject/IProject';
import { api } from '@/_base/classes/api';
import { IShareProjectParams } from '@/_base/interfaces/codeProject/IShareProjectParams';

type FuncType = (params: IShareProjectParams) => Promise<ICodeProject>;

export const shareCodeProject: FuncType = async (params) => {
  const { data } = await api.post('code/project/share', params);
  return data;
};
