/**
 * DeviceLostModal - Alerta de conexão perdida.
 *
 * Responsabilidade: Informar ao usuário que a comunicação com a placa foi
 * interrompida inesperadamente (ex: cabo removido).
 */
'use client';

import { useUI } from '@/_base/context/UIContext';
import React from 'react';

export function DeviceLostModal() {
  const { showDeviceLostWarning, setShowDeviceLostWarning } = useUI();

  if (!showDeviceLostWarning) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0" style={{ borderRadius: '16px' }}>
          <div className="modal-body p-4 text-center">
            <div className="mb-3">
              <i className="bi bi-usb-plug text-danger" style={{ fontSize: '3rem' }}></i>
            </div>
            <h4 className="fw-bold mb-3">Conexão Perdida!</h4>
            <p className="text-secondary mb-4">
              O dispositivo foi desconectado ou o cabo USB foi removido inesperadamente.
              <br />
              <br />
              Por favor, verifique a conexão e tente conectar novamente.
            </p>
            <button type="button" className="btn btn-danger px-4 py-2 rounded-pill fw-bold w-100" onClick={() => setShowDeviceLostWarning(false)}>
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
