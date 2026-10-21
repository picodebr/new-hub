import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';

export const makeDonation = async (student_id: string, donation: number): Promise<IHubUser> => {
  const { data } = await api.post(`/student/donation`, { donation, student_id });
  return data;
};
