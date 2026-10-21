import React from 'react';
import { IoPlayOutline } from 'react-icons/io5';
import { FiCopy, FiSave } from 'react-icons/fi';
import { HiOutlineUpload } from 'react-icons/hi';
import { MdMonitor } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { BsCode } from 'react-icons/bs';
import { CodeEventButtonType, IButtonInfo, ICodeEventButtonProps } from './interfaces';

import { Container } from './styles';

const buttonData: Record<CodeEventButtonType, IButtonInfo> = {
  undo: { label: 'Desfazer', title: '', icon: FaUndo },
  redo: { label: 'Refazer', title: '', icon: FaUndo },
  toText: { label: 'Texto', title: '', icon: BsCode },
  save: { label: 'Salvar', title: '', icon: FiSave },
  upload: {
    label: 'Carregar',
    title: '',
    icon: HiOutlineUpload,
  },
  duplicate: {
    label: 'Duplicar',
    title: '',
    icon: FiCopy,
  },
  // simulation: {
  //   label: 'Simular',
  //   title: '',
  //   icon: IoPlayOutline,
  // },
  debug: {
    label: 'Monitor',
    title: '',
    icon: MdMonitor,
  },
};

export const CodeEventButton: React.FC<ICodeEventButtonProps> = ({ disabled, hide, type, ...props }) => {
  const btn = buttonData[type];

  return (
    <Container {...props} label={btn.label} title={btn.title} data-disabled={disabled} data-type={type} data-hide={hide}>
      {btn.icon({})}
    </Container>
  );
};
