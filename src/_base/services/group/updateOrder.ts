import { api } from '@/_base/classes/api';
import { HubOrderStatusType, IHubGroup } from '@/_base/interfaces/group';

interface IRejectOrderParams {
  status: HubOrderStatusType;
  order_id: string;
}

export const updateOrderStatus = async (params: IRejectOrderParams): Promise<IHubGroup> => {
  const { data } = await api.put(`/group/order/status`, params);
  return data;
};
