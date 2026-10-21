import { api } from '@/_base/classes/api';
import { IHubNotification } from '@/_base/interfaces/notification';

export const markNotificationAsRead = async (notificationId: string): Promise<IHubNotification> => {
  const { data } = await api.put(`/notification/mark_as_read/${notificationId}`);
  return data;
};
