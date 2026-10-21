import { z } from 'zod';

import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { IHubUser } from '../user';
import { ZodCustomSchema } from '../zod';

/** Interfaces and Types */
export interface IAuthRequest {
  identifier: string;
  password: string;
}

export interface IAuthResponse {
  access_token: string;
  user: IHubUser;
}

/** Zod schemas */
export const authSchema: ZodCustomSchema<IAuthRequest> = z.object({
  identifier: z
    .string({ required_error: zodSchemaErrors.REQUIRED_FIELD })
    .trim()
    .min(6, { message: zodSchemaErrors.MININUM_LENGTH_SIX }),
  password: z.string({ required_error: 'Campo obrigatório' }).min(6, { message: zodSchemaErrors.MININUM_LENGTH_SIX }),
});
