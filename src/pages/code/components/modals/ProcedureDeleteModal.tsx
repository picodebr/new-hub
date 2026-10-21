/**
 * ProcedureDeleteModal - Modal de exclusão de blocos personalizados (procedimentos).
 *
 * Responsabilidade: Listar todos os blocos personalizados (custom_def_*) existentes
 * no workspace Blockly e permitir a exclusão selecionada. A exclusão remove o bloco
 * de definição, e o listener do BlocklyWorkspace cuida de remover todas as chamadas
 * associadas em cascata.
 *
 * Operações Principais:
 * - Listagem de procedimentos com radio buttons para seleção.
 * - Exclusão do bloco de definição via `dispose()` + refresh da toolbox.
 * - Alerta visual sobre exclusão em cascata das chamadas.
 */
import React, { useState, useMemo } from 'react';
import * as Blockly from 'blockly/core';

interface ProcedureDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspace: Blockly.WorkspaceSvg;
}

const ProcedureDeleteModal: React.FC<ProcedureDeleteModalProps> = ({ isOpen, onClose, workspace }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const availableProcs = useMemo(() => {
        if (!isOpen) return [];
        const procs: { id: string, name: string }[] = [];
        const blocks = workspace.getAllBlocks(false);

        blocks.forEach(block => {
            if (block.type.startsWith('custom_def_')) {
                const id = block.type.replace('custom_def_', '');
                const prototype = block.getInputTargetBlock('PROTOTYPE');
                if (prototype) {
                    const name = prototype.getFieldValue('NAME') || "Sem nome";
                    procs.push({ id, name });
                }
            }
        });
        return procs;
    }, [isOpen, workspace]);

    // Reset selecionado ao abrir (sem usar useEffect para evitar cascading renders)
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen && !prevIsOpen) {
        setPrevIsOpen(true);
        setSelectedId(null);
    } else if (!isOpen && prevIsOpen) {
        setPrevIsOpen(false);
    }

    const handleDelete = () => {
        if (!selectedId) return;

        // Encontrar o bloco de definição no workspace
        const defBlockType = 'custom_def_' + selectedId;
        const blocks = workspace.getAllBlocks(false);
        const defBlock = blocks.find(b => b.type === defBlockType);

        if (defBlock) {
            // A deleção em cascata será tratada pelo listener no BlocklyWorkspace
            defBlock.dispose(false);
        }

        onClose();

        // Atualiza a toolbox
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
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', border: '5px solid #FF6680' }}>

                    {/* Cabeçalho */}
                    <div className="modal-header border-0 text-white" style={{ backgroundColor: '#FF6680', padding: '20px' }}>
                        <h4 className="modal-title fw-bold" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                            <i className="bi bi-trash me-2"></i>
                            Apagar um Bloco
                        </h4>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4 bg-light">
                        {availableProcs.length === 0 ? (
                            <p className="text-muted text-center fw-bold">Nenhum bloco personalizado criado.</p>
                        ) : (
                            <>
                                <p className="fw-bold text-secondary mb-3">Escolha o bloco para excluir:</p>
                                <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {availableProcs.map(proc => (
                                        <label key={proc.id} className={`list-group-item d-flex gap-3 align-items-center cursor-pointer ${selectedId === proc.id ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                                            <input
                                                className="form-check-input flex-shrink-0"
                                                type="radio"
                                                name="procDelete"
                                                checked={selectedId === proc.id}
                                                onChange={() => setSelectedId(proc.id)}
                                                style={{ width: '1.5em', height: '1.5em' }}
                                            />
                                            <span className="fw-bold fs-5" style={{ color: selectedId === proc.id ? 'white' : 'inherit' }}>
                                                {proc.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}

                        {selectedId && (
                            <div className="mt-3 alert alert-danger d-flex align-items-center" role="alert" style={{ borderRadius: '15px' }}>
                                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                                <div>
                                    <strong>Atenção:</strong> A definição e **todas as chamadas** deste bloco serão apagadas!
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer border-0 bg-light p-3 justify-content-center gap-3">
                        <button
                            type="button"
                            className="btn btn-secondary px-4 fw-bold"
                            onClick={onClose}
                            style={{ borderRadius: '25px', minWidth: '120px' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary px-5 fw-bold shadow"
                            onClick={handleDelete}
                            disabled={!selectedId}
                            style={{ backgroundColor: '#FF6680', borderColor: '#FF6680', borderRadius: '25px', minWidth: '150px' }}
                        >
                            <i className="bi bi-trash-fill me-2"></i>
                            Apagar Bloco
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .active {
                    background-color: #FF6680;
                    border-color: #FF6680;
                }
            `}</style>
        </div>
    );
};

export default ProcedureDeleteModal;
