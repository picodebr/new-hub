import { CoordinateType } from '../shared';

export interface IMazeChallenge {
  size: number;
  start: CoordinateType;
  finish: CoordinateType;
  path: CoordinateType[];
  blocks: string[];
  max_blocks?: number;
  player: MazePlayer;
}

export type MazePlayer = (typeof mazePlayers)[number];
export type MazeCustomBlock = (typeof mazePlayers)[number];

export const mazePlayers = <const>['drone', 'car', 'bicicle', 'ant'];
export const mazeCustomBlocks = <const>[
  'movement_forward',
  'movement_rotate',
  'controls_if_path',
  'controls_if_else_path',
  'controls_repeat_until_reach_end',
];

export interface ISendMazeParams {
  hub_challenge_id: string;
  is_passed: boolean;
}
