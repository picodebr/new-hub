import { api } from '@/_base/classes/api';
import { IStoreMakerResale } from '@/_base/interfaces/storeMaker';

export const acceptResaleStockItem = async (id: string): Promise<IStoreMakerResale> => {
  const { data } = await api.patch(`/store_maker/resale/accept/${id}`);
  return data;
};
