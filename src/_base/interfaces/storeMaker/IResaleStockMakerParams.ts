import { z } from 'zod';
import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { IStoreMakerResaleMetadata } from './IStoreMakerResaleMetadata';

export interface IResaleStockParams {
  hub_group_seller_id: string;
  store_maker_item_id: string;
  hub_group_order_item_id: string;
  hub_school_id: string;
  quantity: number;
  price: string;
  metadata: IStoreMakerResaleMetadata;
}

export const resaleStockSchema: ZodCustomSchema<IResaleStockParams> = z.object({
  hub_group_seller_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  store_maker_item_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  hub_group_order_item_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  hub_school_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  price: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }),
  quantity: z.number({ required_error: zodSchemaErrors.REQUIRED_FIELD }).min(1),
  metadata: z.any(),
});

export const EMPTY_RESALE_STOCK_ITEM: IResaleStockParams = {
  hub_group_seller_id: ``,
  store_maker_item_id: ``,
  hub_group_order_item_id: ``,
  hub_school_id: ``,
  price: `1`,
  quantity: 1,
  metadata: {} as any,
};
