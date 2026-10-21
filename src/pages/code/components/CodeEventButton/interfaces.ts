import { HTMLAttributes } from 'react';
import { IconType } from 'react-icons';

export const codeEventButtonTypes = <const>['undo', 'redo', 'toText', 'debug', 'upload', 'save', 'duplicate'];
export type CodeEventButtonType = (typeof codeEventButtonTypes)[number];

export interface ICodeEventButtonProps extends HTMLAttributes<Omit<HTMLButtonElement, 'type'>> {
  type: CodeEventButtonType;
  hide?: boolean;
  disabled?: boolean;
}

export interface IButtonInfo {
  label: string;
  icon: IconType;
  title: string;
}
