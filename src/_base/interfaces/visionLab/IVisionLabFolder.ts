import { IHubUser } from '../user';
import { IVisionLabProject } from './IVisionLabProject';

export interface IVisionLabFolder {
  id: string;
  hub_user_id: string;
  name: string;
  created_at: string;
  user: IHubUser;
  projects: IVisionLabProject[];
}
