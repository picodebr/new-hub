import { IHubReportMetadata } from './IHubReportMetadata';

export interface IHubReport {
  id: string;
  readable_id: string;
  hub_user_id: string;
  context: string;
  subject: string;
  text: string;
  status: string;
  metadata: IHubReportMetadata;
  files: string[];
  limit_date: string | null;
  created_at: string;
}
