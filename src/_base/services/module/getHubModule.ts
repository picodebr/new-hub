import { api } from '@/_base/classes/api';
import { IHubModule } from '@/_base/interfaces/module';

export const getHubModule = async (module_id: string): Promise<IHubModule> => {
  const { data } = await api.get(`/module/${module_id}`);
  return data;
};
