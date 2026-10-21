import * as z from 'zod';

import { ZodCustomSchema } from '../zod';

export interface IContact {
  email?: string;
  phone?: string;
  name?: string;
}

export const contactSchema: ZodCustomSchema<IContact> = z.object({
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  name: z.string().trim().optional(),
});
