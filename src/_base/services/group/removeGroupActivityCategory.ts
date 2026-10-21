import { api } from '@/_base/classes/api';

export const removeGroupActivityCategory = async (id: string): Promise<void> => {
  await api.delete(`/group/activity_category/${id}`);
};
