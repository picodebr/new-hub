import { IHubCourse } from '../course';
import { IHubModuleLesson } from './IHubModuleLesson';
import { IHubModuleMetadata } from './IHubModuleMetadata';

export interface IHubModule {
  id: string;
  readable_id: number;
  dependency_id: string | null;
  hub_course_id: string;
  is_available?: boolean;
  title: string;
  position: number;
  metadata: IHubModuleMetadata;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  dependency: IHubModule | null;
  course: IHubCourse;
  lessons: IHubModuleLesson[];
}
