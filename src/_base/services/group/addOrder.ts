import { api } from '@/_base/classes/api';
import { IHubGroup } from '@/_base/interfaces/group';

export interface IAddOrderParams {
  group_id: string;
  is_resale?: boolean;
  items: { id: string; quantity: number; hub_store_maker_resale_id?: string }[];
}

export const addOrder = async ({ group_id, items, is_resale }: IAddOrderParams): Promise<IHubGroup> => {
  const { data } = await api.post(`/group/order/add`, { group_id, items, is_resale });
  return data;
};
