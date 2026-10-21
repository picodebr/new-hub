import { api } from '@/_base/classes/api';
import { IHubGroup } from '@/_base/interfaces/group';

interface IRejectOrderParams {
  group_id: string;
  order_id: string;
}

export const rejectOrder = async (params: IRejectOrderParams): Promise<IHubGroup> => {
  const { data } = await api.post(`/group/order/reject`, params);
  return data;
};
