import { api } from '@/_base/classes/api';
import { IHubSchoolGroup } from '@/_base/interfaces/school';

export const listSchoolGroups = async (): Promise<IHubSchoolGroup[]> => {
  const { data } = await api.get(`/school/list_school_groups`);
  return data;
};
