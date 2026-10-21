import { z } from 'zod';

import { ZodCustomSchema } from '../zod';

export interface ISupportData {
  username: string;
  email?: string;
  description: string;
}

export const supportSchema: ZodCustomSchema<ISupportData> = z.object({
  username: z.string({ required_error: 'Campo obrigatório' }).trim().min(6, { message: 'Nome de usuário inválido' }),
  email: z.string().email().optional(),
  description: z.string({ required_error: 'Campo obrigatório' }).trim().min(15, { message: 'A descrição deve ter no mínimo 15 caracteres' }),
});

export const EMPTY_SUPPORT_DATA: ISupportData = {
  username: '',
  email: '',
  description: '',
};
