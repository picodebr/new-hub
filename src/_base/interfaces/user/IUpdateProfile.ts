import { IStoreCart } from '../store';

export default interface IUpdateProfile {
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  school_codes?: string[];
  kanban?: string;
  custom_avatar?: Record<string, string>;
  use_custom_avatar?: boolean;
  cart?: Record<string, IStoreCart[]>;
  store_interests?: string[];
  metadata?: any;
  [key: string]: any;
}
