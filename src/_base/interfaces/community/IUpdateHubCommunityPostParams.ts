import { PostReactionKey, PostReaction } from './PostReaction';

export interface IUpdateHubCommunityPostParams {
  id: string;
  reaction?: PostReactionKey;
  reactions?: PostReaction | any;
}
