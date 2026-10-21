import { IHubSchool } from './ISchool';
import { IHubSchoolGroupMetadata } from './IHubSchoolGroupMetadata';

export interface IHubSchoolGroup {
  id: string;
  display_name: string;
  code: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  schools: IHubSchool[];
  metadata?: IHubSchoolGroupMetadata;
}
