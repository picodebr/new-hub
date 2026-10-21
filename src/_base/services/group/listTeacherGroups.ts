import { api } from '@/_base/classes/api';
import { IHubGroup } from '@/_base/interfaces/group';

export const listTeacherGroups = async (school_id: string): Promise<IHubGroup[]> => {
  const { data } = await api.get(`/group/list_teacher_groups/${school_id}`);
  return data;
};
