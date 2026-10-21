import { HTMLAttributes } from 'react';
import { CodeEventButtonType } from '../CodeEventButton/interfaces';

export interface ICodeEventMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  allowUpload: boolean;
  isProjectOwner: boolean;
  isSignedIn: boolean;
  isTextMode: boolean;
  onClick: (type: CodeEventButtonType) => void;
}
