import { IHubClass } from '../class';
import { IHubGlobalComment } from '../globalComment';
import { IHubGroup } from '../group';
import { HubStatus } from '../shared';
import { IHubUser } from '../user';
import { IHubFactoryProject } from './IHubFactoryProject';
import { IClassProjectMetadata } from './IClassProjectMetadata';

export interface IProject {
  id: string;
  project_id: string | null;
  class_id: string;
  user_id: string | null;
  topic?: string | null;
  title: string;
  project?: IHubFactoryProject;
  description: string | null;
  status: HubStatus;
  metadata: IClassProjectMetadata;
  created_at: Date;
  updated_at: Date;
  groups: IHubGroup[];
  annotations: IHubGlobalComment[];
  educator: IHubUser;
  hub_class: IHubClass;
}

export const EMPTY_PROJECT_DATA: IProject = {
  id: '',
  project_id: null,
  class_id: '',
  user_id: null,
  title: '',
  description: null,
  status: 'stopped',
  metadata: {},
  created_at: new Date(),
  updated_at: new Date(),
  groups: [],
  annotations: [],
  educator: {} as any,
  hub_class: {} as any,
};
