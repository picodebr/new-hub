import { IHubBook } from '../book';
import { IFactoryProjectMetadata } from './IFactoryProjectMetadata';

export interface IHubFactoryProject {
  id: string;
  readable_id: number;
  title: string;
  book_id?: string;
  book?: IHubBook;
  description: string | null;
  metadata: IFactoryProjectMetadata;
  grades: string[];
  created_at: Date;
  updated_at: Date;
}
