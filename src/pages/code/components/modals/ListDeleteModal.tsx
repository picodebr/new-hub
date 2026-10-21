/**
 * ListDeleteModal - Exclusão de listas do projeto com suporte a seleção múltipla.
 *
 * Responsabilidade: Permitir a remoção de listas tanto do ProjectService quanto
 * do Blockly VariableMap, garantindo que o monitor no palco também seja removido.
 */

import React, { useState, useMemo } from 'react';
import * as Blockly from 'blockly/core';
import { useProject } from '@/_base/context/ProjectContext';

interface ListDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Blockly.WorkspaceSvg | null;
  isUploadMode: boolean;
  initialSelection?: string | null;
}

export default function ListDeleteModal({ isOpen, onClose, workspace, isUploadMode, initialSelection }: ListDeleteModalProps) {
  const { getUserLists, stageLists, uploadLists, deleteList, forceSyncLists } = useProject();
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const availableLists = useMemo(() => {
    return getUserLists(isUploadMode ? 'upload' : 'stage');
  }, [isUploadMode, getUserLists, stageLists, uploadLists]);

  // Reset selecionado ao abrir
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setSelectedLists(initialSelection ? [initialSelection] : []);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const handleCheckboxChange = (listName: string) => {
    if (selectedLists.includes(listName)) {
      setSelectedLists(selectedLists.filter((l) => l !== listName));
    } else {
      setSelectedLists([...selectedLists, listName]);
    }
  };

  const handleDelete = () => {
    if (selectedLists.length === 0 || !workspace) return;

    const mode = isUploadMode ? 'upload' : 'stage';

    selectedLists.forEach((name) => {
      // 1. Remove do ProjectService
      deleteList(mode, name);

      // 2. Remove do Workspace Blockly
      const wsVar = workspace.getVariableMap().getVariable(name, 'list');
      if (wsVar) {
        workspace.getVariableMap().deleteVariable(wsVar);
      }
    });

    forceSyncLists();
    onClose();

    setTimeout(() => {
      const toolbox = workspace.getToolbox();
      if (toolbox) {
        toolbox.refreshSelection();
      }
    }, 100);
  };

  if (!isOpen) return null;

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
            boxShadow: '0 0 0 5px #dc3545, 0 10px 30px rgba(0,0,0,0.3)',
          }}
        >
          {/* Cabeçalho */}
          <div
            className="modal-header border-0 text-white"
            style={{ backgroundColor: '#dc3545', padding: '20px', borderTopLeftRadius: '25px', borderTopRightRadius: '25px' }}
          >
            <h4 className="modal-title fw-bold" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
              <i className="bi bi-trash me-2"></i>
              Apagar Listas ({isUploadMode ? 'Upload' : 'Palco'})
            </h4>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 bg-light">
            {availableLists.length === 0 ? (
              <p className="text-muted text-center fw-bold">Nenhuma lista disponível para apagar.</p>
            ) : (
              <>
                <p className="fw-bold text-secondary mb-3">Selecione as listas para excluir:</p>
                <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {availableLists.map((l: any) => (
                    <label key={l.name} className="list-group-item d-flex gap-3 align-items-center cursor-pointer" style={{ cursor: 'pointer' }}>
                      <input
                        className="form-check-input flex-shrink-0"
                        type="checkbox"
                        checked={selectedLists.includes(l.name)}
                        onChange={() => handleCheckboxChange(l.name)}
                        style={{ width: '1.5em', height: '1.5em' }}
                      />
                      <div className="d-flex flex-column">
                        <span className="fw-bold">{l.name}</span>
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {l.isGlobal ? '(Global)' : '(Para este ator)'}
                        </small>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {selectedLists.length > 0 && (
              <div className="mt-3 alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>
                  <strong>Atenção:</strong> Blocos usando estas listas serão apagados do workspace!
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
              className="btn btn-danger px-5 fw-bold shadow"
              onClick={handleDelete}
              disabled={selectedLists.length === 0}
              style={{ borderRadius: '25px', minWidth: '150px' }}
            >
              <i className="bi bi-trash-fill me-2"></i>
              Apagar ({selectedLists.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
