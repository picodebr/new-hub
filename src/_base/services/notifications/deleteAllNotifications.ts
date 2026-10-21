import { api } from '@/_base/classes/api';

export const deleteAllNotifications = async (schoolId: string): Promise<void> => {
  await api.delete(`/notification/delete_all/${schoolId}`);
};
