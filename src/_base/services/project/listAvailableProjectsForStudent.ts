import { api } from '@/_base/classes/api';
import { IProject } from '@/_base/interfaces/project';

export const listAvailableProjectsForStudent = async (): Promise<IProject[]> => {
  const { data } = await api.get(`/project/available`);
  return data;
};
