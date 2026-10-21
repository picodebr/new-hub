/**
 * ListModal - Criação de listas no projeto.
 *
 * Permite ao usuário criar uma nova lista definindo:
 * 1. Nome da lista
 * 2. Escopo (global para todos os atores ou local apenas para o selecionado)
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Blockly from 'blockly/core';
import { useProject } from '@/_base/context/ProjectContext';

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Blockly.WorkspaceSvg | null;
  isUploadMode: boolean;
}

export default function ListModal({ isOpen, onClose, workspace, isUploadMode }: ListModalProps) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('global');
  const { addList, forceSyncLists } = useProject();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setScope('global');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const listName = name.trim();
    if (!listName) {
      alert('Por favor, digite um nome para a lista.');
      return;
    }
    if (!workspace) return;

    const mode = isUploadMode ? 'upload' : 'stage';
    const created = addList(mode, listName, scope as 'global' | 'local');

    if (!created) {
      alert(`Já existe uma lista com o nome "${listName}". Escolha um nome diferente.`);
      return;
    }

    // Cria a variável Blockly com type="list" para feedback visual imediato
    if (!workspace.getVariableMap().getVariable(listName, 'list')) {
      workspace.getVariableMap().createVariable(listName, 'list', created.id);
    }

    forceSyncLists();

    const toolbox = workspace.getToolbox();
    if (toolbox) toolbox.refreshSelection();

    onClose();
  };

  if (!isOpen) return null;

  const activeStyle = { backgroundColor: '#E6821E', borderColor: '#E6821E', color: 'white', fontWeight: 'bold' as const };
  const inactiveStyle = { borderColor: '#ccc', color: '#666', fontWeight: 'bold' as const };

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
            boxShadow: '0 0 0 5px #E6821E, 0 10px 30px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="modal-header border-0 text-white"
            style={{ backgroundColor: '#E6821E', padding: '20px', borderTopLeftRadius: '25px', borderTopRightRadius: '25px' }}
          >
            <h4 className="modal-title fw-bold" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
              <i className="bi bi-list-ul me-2"></i>
              Nova Lista
            </h4>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} style={{ opacity: 1 }}></button>
          </div>

          <div className="modal-body p-4 bg-light">
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary text-uppercase" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>
                Nome da Lista:
              </label>
              <input
                ref={inputRef}
                type="text"
                className="form-control form-control-lg border-2 shadow-sm"
                style={{ borderRadius: '15px', color: '#333', fontWeight: 'bold' }}
                placeholder="Minha Lista..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
            </div>

            {!isUploadMode && (
              <div className="mb-2">
                <label className="form-label fw-bold text-secondary text-uppercase" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>
                  Para quem?
                </label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn flex-grow-1 py-2"
                    style={{
                      borderRadius: '15px',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      ...(scope === 'global'
                        ? { backgroundColor: '#198754', borderColor: '#198754', color: 'white', fontWeight: 'bold' }
                        : inactiveStyle),
                    }}
                    onClick={() => setScope('global')}
                  >
                    <i className="bi bi-globe2 me-2"></i>
                    Para todos os atores
                  </button>
                  <button
                    type="button"
                    className="btn flex-grow-1 py-2"
                    style={{
                      borderRadius: '15px',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      ...(scope === 'local'
                        ? { backgroundColor: '#198754', borderColor: '#198754', color: 'white', fontWeight: 'bold' }
                        : inactiveStyle),
                    }}
                    onClick={() => setScope('local')}
                  >
                    <i className="bi bi-person me-2"></i>
                    Apenas para este ator
                  </button>
                </div>
              </div>
            )}
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
              className="btn px-5 fw-bold shadow text-white"
              onClick={handleConfirm}
              style={{ borderRadius: '25px', minWidth: '150px', ...activeStyle }}
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
