import { z } from 'zod';
import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';

export interface IAddStockMakerParams {
  name: string;
  image: string;
  hub_school_id: string;
  quantity: number;
  reusable: boolean;
  is_service: boolean;
}

export const addStockMakerSchema: ZodCustomSchema<IAddStockMakerParams> = z.object({
  name: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }),
  image: z.any(),
  hub_school_id: z.any(),
  quantity: z.number({ required_error: zodSchemaErrors.REQUIRED_FIELD }).min(1),
  reusable: z.boolean().default(false),
  is_service: z.boolean().default(false),
});

export const EMPTY_STOCK_MAKER_ITEM: IAddStockMakerParams = {
  name: ``,
  image: ``,
  hub_school_id: ``,
  quantity: 1,
  reusable: false,
  is_service: false,
};
