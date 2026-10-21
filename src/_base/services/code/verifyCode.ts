import { api } from '@/_base/classes/api';

type FuncType = (code: string) => Promise<void>;

export const verifyCode: FuncType = async (code) => await api.post('/code/verify', { code });
