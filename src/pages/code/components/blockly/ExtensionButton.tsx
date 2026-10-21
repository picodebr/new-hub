/**
 * ExtensionButton - Gatilho para o modal de extensões.
 *
 * Posicionado de forma absoluta no canto inferior esquerdo do workspace,
 * seguindo a identidade visual do Scratch para expansão de capacidades (IA, Hardware, etc).
 */
import React from 'react';

interface ExtensionButtonProps {
  onClick: () => void;
}

export const ExtensionButton: React.FC<ExtensionButtonProps> = ({ onClick }) => {
  return (
    <div className="extension-button-container">
      <button className="btn btn-add-extension d-flex align-items-center justify-content-center" onClick={onClick} title="Adicionar Extensão">
        <div className="extension-button-icon-wrapper">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Blocos de Extensão Estilo Scratch */}
            <rect className="ext-block-1" x="10" y="16" width="12" height="12" rx="2" fill="white" />
            <rect className="ext-block-2" x="18" y="10" width="12" height="12" rx="2" fill="white" fillOpacity="0.8" />

            {/* Símbolo de Mais (+) representativo */}
            <g className="ext-plus">
              <path d="M25 28H33" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <path d="M29 24V32" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </button>
    </div>
  );
};
