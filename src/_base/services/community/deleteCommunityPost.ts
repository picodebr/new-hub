import { api } from '@/_base/classes/api';

export const deleteCommunityPost = async (id: string): Promise<void> => {
  await api.delete(`/community/post/${id}`);
};
