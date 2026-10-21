import { api } from '@/_base/classes/api';
import { ICreateHubReportParams, IHubReport } from '@/_base/interfaces/report';

export const createReport = async (params: ICreateHubReportParams): Promise<IHubReport> => {
  const { data } = await api.post(`/report/create`, params);
  return data;
};
