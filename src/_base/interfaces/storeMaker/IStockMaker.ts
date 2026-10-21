import { IStoreMakerItem } from './IStoreMakerItem';
import { IStoreMakerSchoolMetadata } from './IStoreMakerSchoolMetadata';

export interface IStockMaker {
  id: string;
  hub_school_id: string;
  store_maker_item_id?: string;
  hub_user_id?: string;
  metadata: IStoreMakerSchoolMetadata;
  quantity: number;
  store_item: IStoreMakerItem;
  updated_at: string;
  interested_users: IStockInterest[];
  cart_additions: IStockInterest[];
}
export interface IStockInterest {
  id: string;
  name: string;
  class_name: string;
  grade: string;
  group_id?: string;
  group_name?: string;
}
