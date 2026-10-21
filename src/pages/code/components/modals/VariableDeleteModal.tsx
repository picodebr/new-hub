/**
 * VariableDeleteModal - Modal de exclusão de variáveis.
 *
 * Responsabilidade: Apresentar ao usuário uma lista de variáveis existentes
 * (do modo Palco ou Upload) e permitir a seleção múltipla para exclusão.
 * A exclusão remove a variável tanto do ProjectService quanto do mapa
 * de variáveis do Blockly, forçando atualização da toolbox.
 *
 * Operações Principais:
 * - Listagem de variáveis com checkboxes para seleção múltipla.
 * - Exclusão em cascata: ProjectService → Blockly VariableMap → Toolbox refresh.
 * - Alerta visual de aviso sobre blocos que serão removidos.
 */

import React, { useState, useMemo } from 'react';
import * as Blockly from 'blockly/core';
import { useProject } from '@/_base/context/ProjectContext';

interface VariableDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Blockly.WorkspaceSvg;
  isUploadMode: boolean;
  initialSelection?: string | null;
}

const VariableDeleteModal: React.FC<VariableDeleteModalProps> = ({ isOpen, onClose, workspace, isUploadMode, initialSelection }) => {
  const { getUserVariables, stageVariables, uploadVariables, deleteVariable, forceSyncVariables } = useProject();
  const [selectedVars, setSelectedVars] = useState<string[]>([]);
  const availableVars = useMemo(() => {
    return getUserVariables(isUploadMode ? 'upload' : 'stage') as any[];
  }, [isUploadMode, getUserVariables, stageVariables, uploadVariables]);

  // Reset selecionado ao abrir (sem usar useEffect para evitar cascading renders)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setSelectedVars(initialSelection ? [initialSelection] : []);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  const handleCheckboxChange = (varName: string) => {
    if (selectedVars.includes(varName)) {
      setSelectedVars(selectedVars.filter((v) => v !== varName));
    } else {
      setSelectedVars([...selectedVars, varName]);
    }
  };

  const handleDelete = async () => {
    if (selectedVars.length === 0) return;

    const mode = isUploadMode ? 'upload' : 'stage';

    // 1. Exclui do ProjectService
    for (const varName of selectedVars) {
      deleteVariable(mode, varName);
    }

    // 2. Exclui do Workspace Blockly
    const blocklyVars = workspace.getVariableMap().getAllVariables();
    selectedVars.forEach((name) => {
      const v = blocklyVars.find((bv) => (bv as unknown as { name: string }).name === name);
      if (v) {
        workspace.getVariableMap().deleteVariable(v);
      }
    });

    // 3. Força atualização da UI
    forceSyncVariables();
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
          {/* Cabeçalho - Vermelho para Perigo */}
          <div
            className="modal-header border-0 text-white"
            style={{ backgroundColor: '#dc3545', padding: '20px', borderTopLeftRadius: '25px', borderTopRightRadius: '25px' }}
          >
            <h4 className="modal-title fw-bold" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
              <i className="bi bi-trash me-2"></i>
              Apagar Variáveis ({isUploadMode ? 'Upload' : 'Palco'})
            </h4>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 bg-light">
            {availableVars.length === 0 ? (
              <p className="text-muted text-center fw-bold">Nenhuma variável disponível para apagar.</p>
            ) : (
              <>
                <p className="fw-bold text-secondary mb-3">Selecione as variáveis para excluir:</p>
                <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {availableVars.map((v: any) => (
                    <label key={v.name} className="list-group-item d-flex gap-3 align-items-center cursor-pointer" style={{ cursor: 'pointer' }}>
                      <input
                        className="form-check-input flex-shrink-0"
                        type="checkbox"
                        checked={selectedVars.includes(v.name)}
                        onChange={() => handleCheckboxChange(v.name)}
                        style={{ width: '1.5em', height: '1.5em' }}
                      />
                      <div className="d-flex flex-column">
                        <span className="fw-bold">{v.name}</span>
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {v.isGlobal ? '(Global)' : '(Para este ator)'}
                        </small>
                      </div>
                      <span className="badge bg-secondary ms-auto">
                        {v.type === 'Number' ? 'Número' : v.type === 'String' ? 'Texto' : v.type}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {selectedVars.length > 0 && (
              <div className="mt-3 alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>
                  <strong>Atenção:</strong> Blocos usando estas variáveis serão apagados do workspace!
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
              disabled={selectedVars.length === 0}
              style={{ borderRadius: '25px', minWidth: '150px' }}
            >
              <i className="bi bi-trash-fill me-2"></i>
              Apagar ({selectedVars.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariableDeleteModal;
