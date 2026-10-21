import { api } from '@/_base/classes/api';
import { BoardFqbn } from '../../interfaces/boards/IBoard';
import { ICompiledCode } from '../../interfaces/code/ICode';

interface IParams {
  board_fqbn: BoardFqbn;
  code: string;
}

type FuncType = (params: IParams) => Promise<ICompiledCode>;

export const compileCode: FuncType = async (params) => {
  const response = await api.post('/code/compile', params);
  return response.data;
};
