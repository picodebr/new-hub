import { api } from '@/_base/classes/api';
import { ICreateHubFormClassUser } from '@/_base/interfaces/form/ICreateHubFormClassUser';

export const createHubFormClassUser = async (data: ICreateHubFormClassUser): Promise<void> => {
  await api.post(`/form/create`, data);
};
