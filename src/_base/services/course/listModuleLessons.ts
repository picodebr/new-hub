import { api } from '@/_base/classes/api';
import { IHubModuleLesson } from '@/_base/interfaces/module';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listModuleLessons = async (course_id: string, module_id: string): Promise<IPagingResponse<IHubModuleLesson>> => {
  const { data } = await api.get(`/course/${course_id}/${module_id}/list`);
  return data;
};
