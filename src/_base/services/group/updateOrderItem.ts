import { api } from '@/_base/classes/api';

interface IRequest {
  item_id: string;
  order_id: string;
  service_consumed_at?: Date | null;
  service_consumed_quantity?: number;
}

export const updateOrderItem = async (body: IRequest): Promise<void> => {
  await api.put(`/group/order/item`, body);
};
