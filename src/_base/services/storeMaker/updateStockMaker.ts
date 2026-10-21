import { api } from '@/_base/classes/api';
import { IStockMaker } from '@/_base/interfaces/storeMaker';
import { IUpdateStockMakerParams } from '@/_base/interfaces/storeMaker/IUpdateStockMakerParams';

export const updateStockMaker = async (params: IUpdateStockMakerParams): Promise<IStockMaker[]> => {
  const { data } = await api.patch(`/store_maker`, params);
  return data;
};
