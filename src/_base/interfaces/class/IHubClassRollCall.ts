import { IHubUser } from '../user';
import { IHubClass } from './IHubClass';
import { IHubClassRollCallStudent } from './IHubClassRollCallStudent';

export interface IHubClassRollCall {
  id: string;
  hub_class_id: string;
  hub_user_id: string;
  metadata: Record<string, any>;
  roll_call_date: string;
  created_at: string;
  updated_at: string;
  hub_class: IHubClass;
  hub_user: IHubUser;
  students_roll_calls: IHubClassRollCallStudent[];
}
