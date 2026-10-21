import { api } from '@/_base/classes/api';

export const removeClass = async (classId: string): Promise<void> => {
  await api.delete(`/class/remove/${classId}`);
};
