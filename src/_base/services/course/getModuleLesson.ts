import { api } from '@/_base/classes/api';
import { IHubModuleLesson } from '@/_base/interfaces/module';

export const getModuleLesson = async (course_id: string, module_id: string, lesson_id: string): Promise<IHubModuleLesson> => {
  const { data } = await api.get(`/course/${course_id}/${module_id}/${lesson_id}`);
  return data;
};
