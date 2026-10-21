import { api } from '@/_base/classes/api';

export const redefinePassword = async (password: string): Promise<void> => {
  await api.patch(`/redefine_password`, { password });
};
