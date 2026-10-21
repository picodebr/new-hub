import { IHubUser } from '../user';
import { IHubCourse } from './IHubCourse';

export interface IHubCourseActivity {
  id: string;
  hub_course_id: string;
  hub_user_id: string;
  metadata: IModuleActivity[];
  created_at: Date;
  updated_at: Date;
  course: IHubCourse;
  user: IHubUser;
}

export interface IModuleActivity extends IActivityRegister {
  lessons: ILessonActivity[];
}

export interface ILessonActivity extends IActivityRegister {}

interface IActivityRegister {
  entity_id: string;
  started_at: number;
  finished_at?: number;
  points_earned?: string;
  coins_earned?: string;
  tries?: number;
  correctAnswersCount?: number;
}
