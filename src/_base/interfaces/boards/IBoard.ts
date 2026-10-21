export const boardFqbn = <const>['arduino:avr:uno', 'arduino:avr:nano'];

export type BoardFqbn = typeof boardFqbn[number];

export interface IBoardPin {
  value: string;
  isAnalog?: boolean;
  isPWM?: boolean;
}

export interface IBoard {
  name: string;
  fqbn: BoardFqbn;
  pins: IBoardPin[];
}
