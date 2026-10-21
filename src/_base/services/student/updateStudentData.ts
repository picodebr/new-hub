import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';

export const updateStudentData = async (student_id: string, coins: number): Promise<IHubUser> => {
  const { data } = await api.patch(`/student/${student_id}`, { coins });
  return data;
};
