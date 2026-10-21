import { IStoreMakerItem } from './IStoreMakerItem';
import { IStoreMakerSchoolMetadata } from './IStoreMakerSchoolMetadata';

export interface IStoreMakerSchool {
  id: string;
  hub_school_id: string;
  store_maker_item_id?: string;
  hub_user_id?: string;
  metadata: IStoreMakerSchoolMetadata;
  quantity: number;
  created_at: Date;
  updated_at: Date;
  store_item: IStoreMakerItem;
}
