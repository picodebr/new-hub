import { api } from '@/_base/classes/api';
import { IStockMaker } from '@/_base/interfaces/storeMaker';

export const getStockMaker = async (): Promise<IStockMaker[]> => {
  const { data } = await api.get(`/store_maker/list`);
  return data;
};
