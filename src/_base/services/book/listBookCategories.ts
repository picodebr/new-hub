import { api } from '@/_base/classes/api';
import { IHubBookCategory } from '@/_base/interfaces/book';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listBookCategories = async (): Promise<IPagingResponse<IHubBookCategory>> => {
  const { data } = await api.get(`/book/category/list`);
  return data;
};
