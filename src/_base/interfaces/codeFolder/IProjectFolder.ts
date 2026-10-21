import { ICodeProject } from '../codeProject/IProject';
import { IHubUser } from '../user';

export interface IProjectFolder {
  id: string;
  name: string;
  hub_user_id: string;
  created_at: string;
  user: IHubUser;
  projects: ICodeProject[];
}

export interface IProjectFolderListingItem extends Omit<IProjectFolder, 'projects'> {
  projects_count: number;
}
