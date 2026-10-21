import { IHubModuleLesson } from '../module';
import { IHubBookCategory } from './IHubBookCategory';
import { IHubBookMetadata } from './IHubBookMetadata';

export interface IHubBook {
  id: string;
  readable_id: number;
  category_id: string;
  title: string;
  description: string | null;
  grades: string[];
  thumbnail: string;
  file: string;
  metadata: IHubBookMetadata;
  created_at: Date;
  updated_at: Date;
  category: IHubBookCategory;
  lessons: IHubModuleLesson[];
}
