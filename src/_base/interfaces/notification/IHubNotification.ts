import { IHubClass } from '../class';
import { IHubSchool, IHubSchoolGroup } from '../school';
import { IHubUser } from '../user';
import { HubNotificationContentType } from './HubNotificationContentType';
import { IHubNotificationMetadata } from './IHubNotificationMetadata';

export interface IHubNotification {
  id: string;
  hub_user_id: string | null;
  hub_class_id: string | null;
  hub_school_id: string | null;
  hub_school_group_id: string | null;
  target_id: string | null;
  target_type: HubNotificationContentType;
  message: string | null;
  metadata: IHubNotificationMetadata;
  opened_by: string[];
  hidden_by: string[];
  created_at: Date;
  updated_at: Date;
  user?: IHubUser;
  class?: IHubClass;
  school?: IHubSchool;
  school_group?: IHubSchoolGroup;
}
