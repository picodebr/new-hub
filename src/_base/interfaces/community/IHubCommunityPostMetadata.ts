import { HubMediaType } from '../shared';
import { PostReaction } from './PostReaction';

export interface IHubCommunityPostMetadata {
  media: HubMediaType[];
  reactions: PostReaction;
}
