import { api } from '@/_base/classes/api';

export const listAvailableSchools = async (code: string): Promise<{ name: string; code: string }[]> => {
  const { data } = await api.get(`/school/list_availables/${code}`);
  return data;
};
