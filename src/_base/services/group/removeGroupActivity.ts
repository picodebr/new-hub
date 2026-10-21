import { api } from '@/_base/classes/api';

export const removeGroupActivity = async (id: string): Promise<void> => {
  await api.delete(`/group/activity/${id}`);
};
