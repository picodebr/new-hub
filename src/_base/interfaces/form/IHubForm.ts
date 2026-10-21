import { IHubFormClass } from './IHubFormClass';

export interface IHubForm {
  id: string;
  title: string;
  description: string | null;
  grades: string[];
  questions: IHubFormQuestion[];
  metadata: IHubFormMetadata;
  created_at: Date;
  updated_at: Date;
  class_links: IHubFormClass[];
}

export interface IHubFormQuestion {
  id: string;
  title: string;
  description?: string;
  example_answer?: string;
}
export interface IHubFormMetadata {}
