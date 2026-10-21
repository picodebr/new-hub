import { api } from '@/_base/classes/api';

export interface IStudentExtract {
  label: string;
  value: string;
  date: Date;
  type: `plus` | `minor`;
}

export const getStudentExtract = async (): Promise<IStudentExtract[]> => {
  const { data } = await api.get(`student/extract`);
  return data;
};
