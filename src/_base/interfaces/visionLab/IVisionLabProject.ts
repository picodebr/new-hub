import { PrivacyModeType } from '../codeProject/IProject';
import { IVisionLabFolder } from './IVisionLabFolder';

export interface IVisionLabProject {
  id: string;
  folder_id: string | null;
  name: string;
  privacy_mode: PrivacyModeType;
  bin_path: string | null;
  model_path: string | null;
  metadata: Record<string, any>;
  labels: string[];
  created_at: string;
  updated_at: string;
  folder: IVisionLabFolder;
}
