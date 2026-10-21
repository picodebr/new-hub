import { api } from '@/_base/classes/api';
import { IHubReport } from '@/_base/interfaces/report';

export const listReports = async (): Promise<IHubReport[]> => {
  const { data } = await api.get(`/report/list`);
  return data.results;
};
