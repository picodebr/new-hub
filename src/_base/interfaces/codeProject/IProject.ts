import { ILearnBotElementLayout } from '@/components/LearnBotSimulator/interfaces';
import { IProjectFolder } from '../codeFolder/IProjectFolder';
import { ProjectFile } from '@/_base/services/code';

export const sourceCodeModes = <const>['block', 'text'];

export type SourceCodeMode = (typeof sourceCodeModes)[number];

export interface IProjectSourceCode {
  variables: string[];
  code: string;
  mode: SourceCodeMode;
  simulation_elements_layout: ILearnBotElementLayout[];
}

export interface ICodeProject {
  id: string;
  folder_id: string;
  name: string;
  source_code: IProjectSourceCode;
  metadata?: ProjectFile | null;
  user_id: string;
  snapshot: string | null;
  private: boolean;
  created_at: string;
  updated_at: string;
  share_links: ICodeProjectShareLink[];
  folder: IProjectFolder;
}
export interface ICodeProjectShareLink {
  id: string;
  hub_user_id: string;
  code_project_id: string;
  accepted_at: Date | null;
  created_at: Date;
}

export const privacyModes = <const>['private', 'public-r', 'public-w', 'link-r', 'link-w', 'invite-r', 'invite-w'];
export type PrivacyModeType = (typeof privacyModes)[number];
