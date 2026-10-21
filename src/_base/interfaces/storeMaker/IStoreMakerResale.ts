import { IHubGroup } from '../group';
import { IStoreMakerResaleMetadata } from './IStoreMakerResaleMetadata';
import { IStoreMakerItem } from './IStoreMakerItem';

export interface IStoreMakerResale {
  id: string;
  hub_group_seller_id: string;
  hub_group_buyer_id?: string;
  store_maker_item_id: string;
  hub_school_id: string;
  approved_by?: string | null;
  quantity: number;
  price: string;
  metadata: IStoreMakerResaleMetadata;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
  seller_group: IHubGroup;
  buyer_group?: IHubGroup;
  store_maker_item: IStoreMakerItem;
}
