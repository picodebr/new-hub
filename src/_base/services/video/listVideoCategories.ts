import { api } from '@/_base/classes/api';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IHubVideoCategory } from '@/_base/interfaces/video';

export const listVideoCategories = async (): Promise<IPagingResponse<IHubVideoCategory>> => {
  const { data } = await api.get(`/video/category/list`);
  return data;
};
