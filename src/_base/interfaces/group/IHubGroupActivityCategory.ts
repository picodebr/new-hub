import { IHubUser } from '../user';
import { IHubGroup } from './IHubGroup';

export interface IHubGroupActivityCategory {
  id: string;
  hub_group_id: string;
  hub_user_id: string;
  title: string;
  description: string | null;
  metadata: IHubGroupActivityCategoryMetadata;
  created_at: Date;
  updated_at: Date;
  group: IHubGroup;
  user: IHubUser;
}

export interface IHubGroupActivityCategoryMetadata {
  color?: string;
  project_activity_title?: string;
  project_activity_parent?: string;
}
