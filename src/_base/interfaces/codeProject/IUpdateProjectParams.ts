import { IProjectSourceCode } from './IProject';

export interface IUpdateProjectParams {
  id: string;
  name?: string;
  folder_id?: string;
  source_code?: IProjectSourceCode;
  snapshot?: string;
  private?: boolean;
}
