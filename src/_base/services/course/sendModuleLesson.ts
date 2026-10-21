import { api } from '@/_base/classes/api';
import { AnswerResultType } from '@/_base/interfaces/challenges';
import { IHubCourseActivity, ILessonActivity } from '@/_base/interfaces/course';

interface IProps {
  course_id: string;
  module_id: string;
  lesson_id: string;
  answers?: AnswerResultType[];
}

export interface ILessonResult extends IHubCourseActivity {
  is_finished: boolean;
  lessonData: ILessonActivity;
}

export const sendModuleLesson = async ({ course_id, lesson_id, module_id, answers }: IProps): Promise<ILessonResult> => {
  const { data } = await api.post(`/course/lesson`, { course_id, module_id, lesson_id, answers });
  return data;
};
