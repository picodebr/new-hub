import { HubStatus } from '../shared';
import { IFactoryProjectMetadata } from './IFactoryProjectMetadata';

export interface IAddProjectParams {
  class_id: string;
  title: string;
  description?: string | null;
  metadata: IFactoryProjectMetadata;
}

export interface IUpdateProjectParams {
  id: string;
  title?: string;
  description?: string | null;
  metadata?: IFactoryProjectMetadata;
  status?: HubStatus;
}
