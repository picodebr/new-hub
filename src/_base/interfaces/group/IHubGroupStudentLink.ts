import { IHubUser } from '../user';
import { IHubGroup } from './IHubGroup';
import { IHubGroupStudentLinkMetadata } from './IHubGroupStudentLinkMetadata';

export interface IHubGroupStudentLink {
  id: string;
  hub_group_id: string | null;
  hub_user_id: string | null;
  metadata: IHubGroupStudentLinkMetadata;
  created_at: Date;
  group: IHubGroup;
  user: IHubUser;
}
