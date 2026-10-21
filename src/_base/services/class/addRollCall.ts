import { api } from '@/_base/classes/api';
import { ICreateHubClassRollCall, IHubClass } from '@/_base/interfaces/class';

export const addRollCall = async ({ hub_class_id, ...body }: ICreateHubClassRollCall): Promise<IHubClass[]> => {
  const { data } = await api.post(`/class/roll_call/${hub_class_id}`, body);
  return data;
};
