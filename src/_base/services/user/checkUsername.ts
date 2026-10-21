import { api } from '@/_base/classes/api';

export const checkUsername = async (username: string): Promise<{ is_valid: boolean }> => {
  const { data } = await api.get(`/check_username/${username}`);
  return data;
};
