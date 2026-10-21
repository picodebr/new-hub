import { api } from '@/_base/classes/api';
import { IHubModule } from '@/_base/interfaces/module';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listModules = async (course_id: string): Promise<IPagingResponse<IHubModule>> => {
  const { data } = await api.get(`/course/${course_id}/list`);
  return data;
};
