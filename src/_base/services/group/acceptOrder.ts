import { api } from '@/_base/classes/api';
import { IHubGroup } from '@/_base/interfaces/group';

interface IAcceptOrderParams {
  group_id: string;
  order_id: string;
}

export const acceptOrder = async (params: IAcceptOrderParams): Promise<IHubGroup> => {
  const { data } = await api.post(`/group/order/accept/`, params);
  return data;
};
