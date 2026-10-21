import { PostReactionKey } from './PostReaction';

export interface IUpdateHubCommunityPostParams {
  id: string;
  reaction: PostReactionKey;
}
