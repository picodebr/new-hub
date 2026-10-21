import { HubContentScope } from '../shared/HubContentScope';
import { IHubBook } from './IHubBook';

export interface IHubBookCategory {
  id: string;
  display_name: string;
  scope: HubContentScope | null;
  created_at: Date;
  updated_at: Date;
  books: IHubBook[];
}
