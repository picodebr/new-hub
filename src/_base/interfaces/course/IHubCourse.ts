import { IHubModule } from '../module';
import { HubContentScope } from '../shared/HubContentScope';

export interface IHubCourse {
  id: string;
  readable_id: number;
  dependency_id: string | null;
  scope: HubContentScope;
  is_available?: boolean;
  title: string;
  description: string | null;
  grades: string[];
  thumbnail: string | null;
  created_at: Date;
  updated_at: Date;
  dependency: IHubCourse | null;
  modules: IHubModule[];
  hours: number;
}
