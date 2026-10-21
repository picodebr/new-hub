/**
 * BoardConnectionWarningModal - Alerta de segurança de hardware.
 *
 * Responsabilidade: Interromper a execução do fluxo se o usuário tentar
 * rodar códigos que dependem da placa física sem estar conectado.
 * Substitui o 'alert' nativo por uma interface amigável e explicativa.
 */
'use client';
/**
 * ExtensionModal - O "Mercado" de funcionalidades do PicoCode Hub.
 *
 * Responsabilidade: Exibir as extensões disponíveis (ex: ML, Música, Caneta)
 * filtradas pelo modo de execução (Palco/Simulada vs Upload/Placa).
 * Segue o padrão estético do Scratch para garantir familiaridade aos usuários.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { EXTENSIONS } from '@/_base/config/extensions/extensions';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExtension: (extId: string) => void;
  mode?: 'stage' | 'upload'; // Modo atual para filtrar extensões
}

const ExtensionModal: React.FC<ExtensionModalProps> = ({ isOpen, onClose, onSelectExtension, mode = 'stage' }) => {
  if (!isOpen) return null;

  const filteredExtensions = EXTENSIONS.filter((ext) => ext.modes.includes(mode));

  return createPortal(
    <div
      className="extension-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9f9f9',
        zIndex: 1000000,
        overflow: 'hidden',
      }}
    >
      <div
        className="modal-content-custom d-flex flex-column w-100 h-100"
        style={{
          backgroundColor: 'transparent',
          border: 'none',
        }}
      >
        {/* Header Roxinho Scratch */}
        <div className="p-3 d-flex align-items-center justify-content-between text-white" style={{ backgroundColor: '#4c97ff', height: '60px' }}>
          <button className="btn text-white p-0 border-0" onClick={onClose} style={{ display: 'flex', alignItems: 'center' }}>
            <i className="bi bi-arrow-left me-2 h5 mb-0"></i>
            <span className="fw-bold">Voltar</span>
          </button>
          <h5 className="mb-0">Escolha uma Extensão</h5>
          <div style={{ width: '60px' }}></div> {/* Spacer para centralizar título */}
        </div>

        {/* Corpo (Lista de Extensões) */}
        <div
          className="p-3 p-sm-4 flex-grow-1 overflow-auto"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px',
            alignContent: 'start',
          }}
        >
          {filteredExtensions.length === 0 ? (
            <div className="text-center text-muted py-5 w-100">
              <i className="bi bi-puzzle display-4 mb-3 d-block"></i>
              <p>Nenhuma extensão disponível para este modo.</p>
            </div>
          ) : (
            filteredExtensions.map((ext) => (
              <div
                key={ext.id}
                className="bg-white rounded shadow-sm d-flex flex-column overflow-hidden position-relative"
                style={{
                  height: 'auto',
                  minHeight: '220px',
                  border: '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
                onClick={() => onSelectExtension(ext.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#ecececff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {/* Bloco Colorido Superior (Banner) */}
                <div
                  className="flex-grow-1 bg-light position-relative"
                  style={{
                    height: '120px',
                    backgroundColor: '#e2e8f0',
                    backgroundImage: `url(${ext.CardBannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Label verdezinho com o ícone no canto inferior esquerdo */}
                  <div
                    className="position-absolute d-flex align-items-center justify-content-center text-white"
                    style={{
                      bottom: '-24px',
                      left: '15px',
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#ffffffff',
                      borderRadius: '8px',
                      border: '4px solid white',
                      zIndex: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {ext.badgeUrl ? (
                      <Image
                        src={ext.badgeUrl}
                        alt={ext.name}
                        width={48}
                        height={48}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                        unoptimized
                      />
                    ) : (
                      <i className="bi bi-box" style={{ fontSize: '1.4rem' }}></i>
                    )}
                  </div>
                </div>

                {/* Detalhes Inferiores */}
                <div className="bg-white p-3 pt-4 border-top d-flex flex-column flex-grow-1" style={{ position: 'relative' }}>
                  <h6 className="mb-2 fw-bold text-dark mt-1" style={{ fontSize: '1.1rem' }}>
                    {ext.name}
                  </h6>
                  <p className="mb-2 text-muted" style={{ fontSize: '13px', lineHeight: '1.2' }}>
                    {ext.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ExtensionModal;
