import { BoardFqbn } from '../boards/IBoard';

export interface ICompiledCode {
  board_fqbn: BoardFqbn;
  compiler_message: string;
  build_data: number[];
}
