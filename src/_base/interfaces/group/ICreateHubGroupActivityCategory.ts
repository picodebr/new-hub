/** Interfaces and Types */

import { z } from 'zod';
import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { IHubGroupActivityCategoryMetadata } from './IHubGroupActivityCategory';

export interface ICreateHubGroupActivityCategoryDTO {
  hub_group_id: string;
  title: string;
  description?: string;
  metadata?: IHubGroupActivityCategoryMetadata;
}

/** Zod schemas */

export const createHubGroupActivityCategorySchema: ZodCustomSchema<ICreateHubGroupActivityCategoryDTO> = z.object({
  hub_group_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  title: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().optional(),
  metadata: z.any().optional(),
});
