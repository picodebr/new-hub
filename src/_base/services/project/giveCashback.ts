import { api } from '@/_base/classes/api';
import { ClassProjectMetadataReward } from '@/_base/interfaces/project/IClassProjectMetadata';

export const giveCashback = async (id: string, params: { rewards: Record<string, ClassProjectMetadataReward[]> }): Promise<void> => {
  await api.put(`/project/cashback/${id}`, params);
};
