import { IHubUser } from '../user';
import { IHubGroup } from './IHubGroup';

export interface IHubGroupActivity {
  id: string;
  hub_group_id: string;
  hub_user_id: string;
  hub_group_activity_category_id?: string;
  title: string;
  description: string | null;
  file_url: string;
  metadata: { color?: string };
  created_at: Date;
  group: IHubGroup;
  user: IHubUser;
}
