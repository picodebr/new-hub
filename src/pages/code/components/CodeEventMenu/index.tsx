import React from 'react';
import { ICodeEventMenuProps } from './interfaces';
import { codeEventButtonTypes } from '../CodeEventButton/interfaces';
import { CodeEventButton } from '../CodeEventButton';

export const CodeEventMenu: React.FC<ICodeEventMenuProps> = ({ allowUpload, isTextMode, onClick, isProjectOwner }) => (
  <div className="flex items-center justify-end px-4 gap-3 absolute z-50 right-10 top-16 bg-card border border-border/60 rounded-xl shadow-lg">
    {codeEventButtonTypes.map((type) => (
      <CodeEventButton
        key={type}
        type={type}
        onClick={() => onClick(type)}
        hide={
          (type === 'save' && !isProjectOwner) || type === 'duplicate' || (type === 'toText' && isTextMode)
        }
        disabled={type === 'upload' && !allowUpload}
      />
    ))}
  </div>
);
