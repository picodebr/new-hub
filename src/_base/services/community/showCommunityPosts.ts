import { api } from '@/_base/classes/api';
import { IHubCommunityPost } from '@/_base/interfaces/community';

export const listCommunityPosts = async (): Promise<IHubCommunityPost[]> => {
  const { data } = await api.get(`/community/post/list`);
  return data;
};

export const showCommunityPosts = listCommunityPosts;
