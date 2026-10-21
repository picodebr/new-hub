/**
 * BoardConnectionWarningModal - Alerta de segurança de hardware.
 *
 * Responsabilidade: Interromper a execução do fluxo se o usuário tentar
 * rodar códigos que dependem da placa física sem estar conectado.
 * Substitui o 'alert' nativo por uma interface amigável e explicativa.
 */
'use client';

import { useUI } from '@/_base/context/UIContext';
import React from 'react';

export function BoardConnectionWarningModal() {
  const { showBoardConnectionWarning, setShowBoardConnectionWarning } = useUI();

  if (!showBoardConnectionWarning) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0" style={{ borderRadius: '16px' }}>
          <div className="modal-body p-4 text-center">
            <div className="mb-3">
              <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '3rem' }}></i>
            </div>
            <h4 className="fw-bold mb-3">Placa Desconectada</h4>
            <p className="text-secondary mb-4">
              Identificamos blocos da <strong>Placa</strong> no seu código!
              <br />
              <br />
              Por favor, certifique-se de plugar o seu cabo USB e clicar no ícone de conexão no menu superior antes de executar este projeto.
            </p>
            <button
              type="button"
              className="btn btn-primary px-4 py-2 rounded-pill fw-bold w-100"
              onClick={() => setShowBoardConnectionWarning(false)}
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
