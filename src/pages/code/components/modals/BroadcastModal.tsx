/**
 * Componente BroadcastModal - Gerenciador de Criação de Novas Mensagens.
 *
 * Permite ao usuário criar novas mensagens de transmissão (broadcast) no projeto.
 * Estas mensagens são globais e podem ser usadas por qualquer ator para disparar eventos.
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Blockly from 'blockly/core';
import { useProject } from '@/_base/context/ProjectContext';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Blockly.WorkspaceSvg | null;
}

export default function BroadcastModal({ isOpen, onClose, workspace }: BroadcastModalProps) {
  const [name, setName] = useState('');
  const { addBroadcastMessage, getBroadcastMessages } = useProject();
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o estado inicial ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setName('');
      // Foca automaticamente no campo de nome
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const msgName = name.trim();
    if (!msgName) {
      alert('Por favor, digite um nome para a mensagem.');
      return;
    }
    if (!workspace) return;

    // Verificar se já existe
    const messages = getBroadcastMessages();
    if (messages.includes(msgName)) {
      alert(`Já existe uma mensagem com o nome "${msgName}". Escolha um nome diferente.`);
      return;
    }

    // Adicionar ao projeto
    addBroadcastMessage(msgName);

    // Atualizar o campo que disparou a abertura (se houver)
    const win = window as unknown as {
      pendingBroadcastField?: Blockly.FieldDropdown;
      lastBroadcastBlockId?: string;
    };

    if (win.pendingBroadcastField) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const field = win.pendingBroadcastField as any;

      // Força a atualização do menu antes de setar o valor
      if (field.getOptions) {
        field.getOptions(false);
      }

      field.setValue(msgName);

      // Limpa o estado global
      win.pendingBroadcastField = undefined;
    }

    onClose();
  };

  if (!isOpen) return null;

  // Estilo Amarelo/Laranja (Eventos)
  const eventColor = '#FFBF00';

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered mx-2 mx-sm-auto">
        <div
          className="modal-content border-0"
          style={{
            borderRadius: '25px',
            overflow: 'hidden',
            isolation: 'isolate',
            backgroundColor: '#f8f9fa',
            boxShadow: `0 0 0 5px ${eventColor}, 0 10px 30px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Header Playful */}
          <div
            className="modal-header border-0 text-white"
            style={{ backgroundColor: eventColor, padding: '20px', borderTopLeftRadius: '25px', borderTopRightRadius: '25px' }}
          >
            <h4 className="modal-title fw-bold" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
              <i className="bi bi-broadcast me-2"></i>
              Nova Mensagem
            </h4>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} style={{ opacity: 1 }}></button>
          </div>

          <div className="modal-body p-4 bg-light">
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary text-uppercase" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>
                Nome da Mensagem:
              </label>
              <input
                ref={inputRef}
                type="text"
                className="form-control form-control-lg border-2 shadow-sm"
                style={{ borderRadius: '15px', color: '#333', fontWeight: 'bold' }}
                placeholder="Minha mensagem..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                maxLength={50}
              />
            </div>

            <div className="alert alert-warning border-0" style={{ borderRadius: '15px', backgroundColor: '#FFF9E6', color: '#856404' }}>
              <i className="bi bi-info-circle-fill me-2"></i>
              Mensagens permitem que diferentes atores se comuniquem entre si.
            </div>
          </div>

          <div
            className="modal-footer border-0 bg-light p-3 justify-content-center gap-3"
            style={{ borderBottomLeftRadius: '25px', borderBottomRightRadius: '25px' }}
          >
            <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={onClose} style={{ borderRadius: '25px', minWidth: '120px' }}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn text-white px-5 fw-bold shadow"
              onClick={handleConfirm}
              style={{ borderRadius: '25px', minWidth: '150px', backgroundColor: eventColor, borderColor: eventColor }}
            >
              <i className="bi bi-check-lg me-2"></i>
              CRIAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
