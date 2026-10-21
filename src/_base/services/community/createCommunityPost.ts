import { api } from '@/_base/classes/api';
import { ICreateHubCommunityPostParams, IHubCommunityPost } from '@/_base/interfaces/community';

export const createCommunityPost = async (params: ICreateHubCommunityPostParams): Promise<IHubCommunityPost> => {
  const { data } = await api.post(`/community/post`, params);
  return data;
};
