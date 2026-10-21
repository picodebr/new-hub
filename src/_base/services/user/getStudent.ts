import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';

export const getStudent = async (student_id: string): Promise<IHubUser> => {
  const { data } = await api.get(`/student/${student_id}`);
  return data;
};
