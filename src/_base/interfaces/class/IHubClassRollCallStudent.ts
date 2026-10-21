import { IHubUser } from '../user';
import { IHubClassRollCall } from './IHubClassRollCall';

export interface IHubClassRollCallStudent {
  id: string;
  hub_class_roll_call_id: string;
  hub_user_id: string;
  metadata: Record<string, any>;
  hub_user: IHubUser;
  hub_class_roll_call: IHubClassRollCall;
}
