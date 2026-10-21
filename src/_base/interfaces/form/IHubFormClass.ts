import { IHubClass } from '../class';
import { IHubUser } from '../user';
import { IHubForm } from './IHubForm';
import { IHubFormClassUser } from './IHubFormClassUser';

export interface IHubFormClass {
  id: string;
  hub_form_id: string | null;
  hub_class_id: string;
  responsible_id: string;
  metadata: IHubFormClassMetadata;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  form: IHubForm;
  hub_class: IHubClass;
  responsible: IHubUser;
  student_relations: IHubFormClassUser[];
}

export interface IHubFormClassMetadata {}
