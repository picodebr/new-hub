import { z } from 'zod';

import { ZodCustomSchema } from '../zod';

export interface IRecoverPassword {
  identifier: string;
  new_password: string;
  password_confirmation: string;
  recovery_token: string;
}

export const recoverPasswordSchema: ZodCustomSchema<IRecoverPassword> = z.object({
  identifier: z.string({ required_error: 'Campo obrigatório' }).trim().min(6, { message: 'Campo inválido' }),
  new_password: z.string({ required_error: 'Campo obrigatório' }).min(6, { message: 'Campo inválido' }),
  password_confirmation: z.string({ required_error: 'Campo obrigatório' }).min(6, { message: 'Campo inválido' }),
  recovery_token: z.string({ required_error: 'Campo obrigatório' }).min(4, { message: 'Campo inválido' }).max(4, { message: 'Campo inválido' }),
});
