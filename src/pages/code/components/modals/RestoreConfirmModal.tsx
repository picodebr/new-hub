/**
 * RestoreConfirmModal - Confirmação de restauração de firmware.
 *
 * Responsabilidade: Solicitar autorização expressa do usuário antes de
 * interromper a execução e regravar o firmware original na placa.
 */
'use client';

import { useFirmware } from '@/_base/context/FirmwareContext';
import { useUI } from '@/_base/context/UIContext';
import React from 'react';

export function RestoreConfirmModal() {
  const { showRestoreConfirmModal, setShowRestoreConfirmModal } = useUI();
  const { restoreBoard } = useFirmware();

  // Precisamos de uma ref mock ou real para o useCodeExecution,
  // mas no Home já temos o handleStop vindo de lá.
  // Para manter o modal independente, vamos apenas focar na confirmação.

  if (!showRestoreConfirmModal) return null;

  const handleConfirm = () => {
    setShowRestoreConfirmModal(false);
    // O disparo real será coordenado pelo componente que chamou o modal
    // ou podemos disparar aqui se passarmos as funções necessárias.
    // DESIGN DECISION: O componente que abre o modal passa o callback ou
    // usamos um evento global. Para simplificar, vamos disparar um evento customizado.
    window.dispatchEvent(new CustomEvent('confirm-restore-board'));
  };

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070, backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '24px', overflow: 'hidden' }}>
          <div className="modal-body p-5 text-center">
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle"
                style={{ width: '80px', height: '80px' }}
              >
                <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '2.5rem' }}></i>
              </div>
            </div>

            <h3 className="fw-bold mb-3" style={{ color: '#131432' }}>
              Restaurar Conexão?
            </h3>

            <p className="text-secondary mb-5 px-3">
              Isso irá interromper qualquer código em execução e irá apagar o código salvo na placa para que ela possa interagir com o palco.
              <br />
              <span className="fw-bold text-dark">Deseja continuar?</span>
            </p>

            <div className="d-flex gap-3">
              <button
                type="button"
                className="btn btn-light px-4 py-3 rounded-4 fw-bold flex-grow-1"
                style={{ border: '1px solid #e1e4e8' }}
                onClick={() => setShowRestoreConfirmModal(false)}
              >
                Manter como está
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 py-3 rounded-4 fw-bold flex-grow-1 shadow-sm"
                style={{ backgroundColor: '#131432', border: 'none' }}
                onClick={handleConfirm}
              >
                Restaurar Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
