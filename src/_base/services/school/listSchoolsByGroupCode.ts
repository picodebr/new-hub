import { api } from '@/_base/classes/api';
import { IHubUserSchool } from '@/_base/interfaces/school';

export const listSchoolsByGroupCode = async (code: string): Promise<IHubUserSchool[]> => {
  const { data } = await api.get(`/school/list_schools/${code}`);
  return data;
};
