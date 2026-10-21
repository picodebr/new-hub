import { ProjectFile } from '@/_base/services/code';
import { IProjectSourceCode } from './IProject';

export interface ICreateProjectParams {
  name: string;
  folder_id: string;
  source_code?: IProjectSourceCode;
  snapshot?: string;
  private?: boolean;
  metadata?: ProjectFile;
}
