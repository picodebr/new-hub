import { IHubUser } from '../user';
import { IHubCommunityPostMetadata } from './IHubCommunityPostMetadata';

export interface IHubCommunityPost {
  id: string;
  readable_id: string;
  hub_user_id: string;
  hub_community_post_id: string;
  content: string;
  metadata: IHubCommunityPostMetadata;
  created_at: string;
  updated_at: string;
  user: IHubUser;
  replies: IHubCommunityPost[];
}
