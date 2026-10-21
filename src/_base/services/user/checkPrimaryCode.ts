import { api } from '@/_base/classes/api';
import { HubUserType } from '@/_base/interfaces/user';

export const checkPrimaryCode = async (userType: HubUserType, primaryCode: string): Promise<{ is_valid: boolean }> => {
  const uri = userType === 'teacher' ? `/school/check_group/${primaryCode}` : `/class/check_code/${primaryCode}`;

  const { data } = await api.get(uri);
  return data;
};
