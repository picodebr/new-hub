import { api } from '@/_base/classes/api';
import { IStoreMakerResale } from '@/_base/interfaces/storeMaker';

export const getStockResales = async (school_id: string): Promise<IStoreMakerResale[]> => {
  const { data } = await api.get(`/store_maker/resale/list/${school_id}`);
  return data;
};
