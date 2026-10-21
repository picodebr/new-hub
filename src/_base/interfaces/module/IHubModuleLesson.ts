import { IHubBook } from '../book';
import { IHubChallenge } from '../challenges';
import { IHubVideo } from '../video';
import { HubModuleLessonType } from './HubModuleLessonType';
import { IHubModule } from './IHubModule';
import { IHubModuleLessonMetadata } from './IHubModuleLessonMetadata';

export interface IHubModuleLesson {
  id: string;
  readable_id: number;
  module_id: string;
  video_id: string | null;
  book_id: string | null;
  title: string;
  description: string | null;
  position: number;
  lesson_type: HubModuleLessonType;
  metadata: IHubModuleLessonMetadata;
  created_at: Date;
  updated_at: Date;
  module: IHubModule;
  video: IHubVideo | null;
  book: IHubBook | null;
  challenges: IHubChallenge[];
}
