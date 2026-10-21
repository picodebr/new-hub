import { z } from 'zod';
import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';

export interface ICreateCodeProjectFolderParams {
  name: string;
}

/** Zod schemas */
export const createCodeProjectFolderSchema: ZodCustomSchema<ICreateCodeProjectFolderParams> = z.object({
  name: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
});
