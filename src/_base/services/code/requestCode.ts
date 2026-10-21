import { api } from '@/_base/classes/api';

interface IParams {
  name: string;
  email: string;
}
type FuncType = (data: IParams) => Promise<void>;

export const requestCode: FuncType = (data) => api.post('/code/request', data);
