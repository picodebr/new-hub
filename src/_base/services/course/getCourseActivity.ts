import { api } from '@/_base/classes/api';
import { IHubCourseActivity } from '@/_base/interfaces/course';

export const getCourseActivity = async (course_id: string): Promise<IHubCourseActivity> => {
  const { data } = await api.get(`/course/activity/${course_id}`);
  return data;
};
