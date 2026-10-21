import { api } from '@/_base/classes/api';
import { IHubReport } from '@/_base/interfaces/report';

export const showReport = async (id: string): Promise<IHubReport> => {
  const { data } = await api.get(`/report/${id}`);
  return data;
};
