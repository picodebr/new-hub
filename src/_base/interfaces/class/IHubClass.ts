import { IHubFormClass } from '../form';
import { IProject } from '../project';
import { IHubUserSchool } from '../school';
import { IHubUser } from '../user';
import { IHubClassRollCall } from './IHubClassRollCall';

export interface IHubClass {
  id: string;
  hub_school_id: string;
  display_name: string;
  description: string | null;
  code: string;
  grade: string;
  students: IHubUser[];
  projects: IProject[];
  hub_school: IHubUserSchool;
  roll_calls: IHubClassRollCall[];
  form_links: IHubFormClass[];
  current_form?: IHubFormClass;
}
