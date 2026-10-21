import { api } from '@/_base/classes/api';
import { IProjectFolder } from '@/_base/interfaces/codeFolder/IProjectFolder';
import { IPagingResponse } from '@/_base/interfaces/shared';

type FuncType = () => Promise<IPagingResponse<IProjectFolder>>;

export const listCodeProjectFolders: FuncType = async () => {
  const { data } = await api.get(`code/folders`);

  return data;
};
