import { IStoreMakerItem } from '../storeMaker';
import { IHubUser } from '../user';
import { IHubGroup } from './IHubGroup';

export interface IHubGroupOrder {
  id: string;
  readable_id: string;
  hub_group_id: string;
  hub_user_id: string;
  approved_by: string | null;
  total: string;
  metadata: IHubGroupOrderMetadata;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  group: IHubGroup;
  student: IHubUser;
  educator: IHubUser;
  items: IHubGroupOrderItem[];
}
export const hubOrderStatusTypes = <const>[`in_separation`, `waiting_group`, `delivered`, `forgotten`];
export type HubOrderStatusType = (typeof hubOrderStatusTypes)[number];

export interface IHubGroupOrderMetadata {
  denied_at?: string | null;
  is_resale?: boolean;
  status: HubOrderStatusType;
}

export interface IHubGroupOrderItem {
  id: string;
  hub_group_order_id: string;
  store_maker_item_id: string;
  metadata: IHubGroupOrderItemMetadata;
  quantity: number;
  order: IHubGroupOrder;
  store_item: IStoreMakerItem;
}

export interface IHubGroupOrderItemMetadata {
  hub_store_maker_resale_id?: string;

  // Only items of type "service"
  service_consumed_at?: Date;
  service_consumed_quantity?: number;
}
