import { api } from '@/_base/classes/api';
import { IStoreMakerResale } from '@/_base/interfaces/storeMaker';
import { IResaleStockParams } from '@/_base/interfaces/storeMaker/IResaleStockMakerParams';

export const resaleStockItem = async (body: IResaleStockParams): Promise<IStoreMakerResale> => {
  const { data } = await api.post(`/store_maker/resale`, body);
  return data;
};
