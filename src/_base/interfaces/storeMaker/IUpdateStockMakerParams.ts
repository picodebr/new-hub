import { z } from 'zod';
import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';

export interface IUpdateStockMakerParams {
  items: { id: string; quantity: number }[];
}

export const updateStockMakerSchema: ZodCustomSchema<IUpdateStockMakerParams> = z.object({
  items: z.array(z.object({ id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(), quantity: z.number().min(0) })),
});
