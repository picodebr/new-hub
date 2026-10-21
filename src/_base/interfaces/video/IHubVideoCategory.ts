import { HubContentScope } from '../shared/HubContentScope';
import { IHubVideo } from './IHubVideo';

export interface IHubVideoCategory {
  id: string;
  display_name: string;
  scope: HubContentScope | null;
  created_at: Date;
  updated_at: Date;
  videos: IHubVideo[];
}
