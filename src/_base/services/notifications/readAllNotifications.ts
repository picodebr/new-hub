import { api } from '@/_base/classes/api';
import { IHubNotification } from '@/_base/interfaces/notification';

export const readAllNotifications = async (schoolId: string): Promise<IHubNotification[]> => {
  const { data } = await api.put(`/notification/read_all/${schoolId}`);
  return data;
};
