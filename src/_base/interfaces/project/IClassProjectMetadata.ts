import { IFactoryProjectMetadata } from './IFactoryProjectMetadata';

export interface IClassProjectMetadata extends IFactoryProjectMetadata {
  //                 ⬇️ STUDENT_ID
  rewards?: Record<string, ClassProjectMetadataReward[]>;
  finished_activities?: string[]; // Name of activities
}
export type ClassProjectMetadataReward = { reward_value: string; tax_value: string; activity_title: string; is_missing: boolean };
