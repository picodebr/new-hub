import { api } from '@/_base/classes/api';
import { IStockMaker } from '@/_base/interfaces/storeMaker';
import { IAddStockMakerParams } from '@/_base/interfaces/storeMaker/IAddStockMakerParams';

export const addItemInStockMaker = async (body: IAddStockMakerParams): Promise<IStockMaker> => {
  const { data } = await api.post(`/store_maker/add`, body);
  return data;
};
