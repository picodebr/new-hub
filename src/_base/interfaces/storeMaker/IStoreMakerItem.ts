import { IStockMaker } from './IStockMaker';
import { IStoreMakerSchoolMetadata } from './IStoreMakerSchoolMetadata';

export interface IStoreMakerItem {
  id: string;
  name: string;
  description: string | null;
  picture: string;
  video_url: string | null;
  price: string;
  stock_schools: IStockMaker[];
  metadata: IStoreMakerSchoolMetadata;
}
