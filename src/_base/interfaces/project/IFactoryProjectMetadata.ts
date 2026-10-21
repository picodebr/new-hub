import { IHubProjectStep } from './IHubProjectStep';

export interface IFactoryProjectMetadata {
  steps?: IHubProjectStep[];
  presentation?: string;
  bncc?: string[];
  tools?: string[];
  attachments?: string[];
  thumbnail?: string;
}
