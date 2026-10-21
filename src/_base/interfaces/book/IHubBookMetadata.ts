export interface IHubBookMetadata {
  rewards?: IHubBookMetadataReward[];
}

export interface IHubBookMetadataReward {
  activity: string;
  step: string;
  color: string;
  reward_value: string;
  reward_type: BookMetadataRewardType;
}

export const bookMetadataRewardTypes = <const>[`coins`];
export type BookMetadataRewardType = (typeof bookMetadataRewardTypes)[number];
