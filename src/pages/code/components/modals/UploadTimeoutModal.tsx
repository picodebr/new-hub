/**
 * UploadTimeoutModal - Alerta de falha de resposta da placa.
 *
 * Responsabilidade: Avisar o usuário quando a placa demora para responder
 * (timeout) e sugerir a reconexão física do cabo USB.
 */
'use client';

import React from 'react';
import { useUI } from '@/_base/context/UIContext';

export function UploadTimeoutModal() {
  const { showUploadTimeoutModal, setShowUploadTimeoutModal, setShowRocket, setRocketPhase } = useUI();

  if (!showUploadTimeoutModal) return null;

  const handleClose = () => {
    setShowUploadTimeoutModal(false);
    // Limpa o estado do foguete para permitir nova tentativa limpa
    setShowRocket(false);
    setRocketPhase('');
  };

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1080, backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '24px', overflow: 'hidden' }}>
          <div className="modal-body p-5 text-center">
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 rounded-circle"
                style={{ width: '80px', height: '80px' }}
              >
                <i className="bi bi-usb-plug-fill text-danger" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>

            <h3 className="fw-bold mb-3" style={{ color: '#131432' }}>
              Placa sem resposta
            </h3>

            <p className="text-secondary mb-5 px-3">
              A placa demorou para responder aos comandos.
              <br />
              <br />
              <span className="fw-bold text-dark">Por favor, desconecte e reconecte o cabo USB</span> da placa e tente novamente.
            </p>

            <button
              type="button"
              className="btn btn-danger px-5 py-3 rounded-4 fw-bold w-100 shadow-sm"
              style={{ backgroundColor: '#dc3545', border: 'none' }}
              onClick={handleClose}
            >
              Entendi, vou reconectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
