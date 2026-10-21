import { z } from 'zod';

import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { ICreateHubGroupParams } from './ICreateHubGroupParams';
import { IHubGroupMetadata } from './IHubGroupMetadata';

/** Interfaces and Types */
export interface IUpdateHubGroupParams extends Omit<Partial<ICreateHubGroupParams>, `hub_project_class_id`> {
  id: string;
  metadata?: IHubGroupMetadata;
}

/** Zod schemas */
export const updateHubGroupSchema: ZodCustomSchema<IUpdateHubGroupParams> = z.object({
  id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  display_name: z.string().trim(),
  users: z.array(z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid()).min(1, { message: zodSchemaErrors.REQUIRED_FIELD }),
  user_roles: z.record(z.string().uuid(), z.string()).optional(),
  metadata: z.any(),
});
