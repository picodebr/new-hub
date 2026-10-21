/**
 * Componente ProcedureModal - Criador de Blocos Personalizados (Procedimentos).
 *
 * Este modal permite que o usuário crie seus próprios blocos, definindo:
 * 1. O nome do bloco (o texto de comando).
 * 2. Entradas de dados (parâmetros) do tipo Número, Texto ou Booleano.
 * 3. Rótulos de texto para melhor legibilidade.
 *
 * O funcionamento baseia-se em um "Workspace de Pré-visualização" (mini-Blockly)
 * onde o bloco é montado e editado visualmente antes de ser registrado no projeto.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { CustomBlockDefinitions, registerCustomBlockFromSpec, registerCustomExtensions } from '@/_base/config/custom_definitions';

// CORREÇÃO: Forçar desativação da lógica de toque globalmente para este módulo para prevenir prompts nativos.
// Isso garante que mesmo em dispositivos de toque (ou simulados), o editor inline (WidgetDiv) seja usado.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FieldTextInput = (Blockly as any).FieldTextInput;
  if (FieldTextInput) {
    FieldTextInput.prototype.useTouchInteraction_ = () => false;
  }
} catch (e) {
  console.warn('Failed to override Blockly touch interaction', e);
}

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Blockly.WorkspaceSvg | null;
}

interface IProcedureArg {
  type: string;
  value: string;
}

export default function ProcedureModal({ isOpen, onClose, workspace }: ProcedureModalProps) {
  const previewDiv = useRef<HTMLDivElement>(null);
  const previewWorkspace = useRef<Blockly.WorkspaceSvg | null>(null);

  // Estado interno do bloco em construção: Nome principal e lista de argumentos/rótulos.
  const blockStateRef = useRef<{ mainName: string; args: IProcedureArg[] }>({
    mainName: 'nome do bloco',
    args: [],
  });

  const [screenRefresh, setScreenRefresh] = useState(false);
  const [selectedArgIndex, setSelectedArgIndex] = useState(-1);
  const [deleteBubbleVisible, setDeleteBubbleVisible] = useState(false);
  const [deleteBubblePos, setDeleteBubblePos] = useState({ top: 0, left: 0 });
  const hideTrashTimer = useRef<NodeJS.Timeout | null>(null);

  // --- HELPERS E AÇÕES ---

  const findArgIndex = useCallback((block: Blockly.Block): number => {
    const parent = block.getParent();
    if (!parent) return -1;
    for (let i = 0; i < parent.inputList.length; i++) {
      const input = parent.inputList[i];
      if (input.connection && input.connection.targetBlock() === block) {
        if (input.name.startsWith('ARG_')) return parseInt(input.name.split('_')[1]);
      }
    }
    return -1;
  }, []);

  const hideDeleteBubble = useCallback(() => {
    setDeleteBubbleVisible(false);
    setSelectedArgIndex(-1);
  }, []);

  const scheduleHideTrash = useCallback(() => {
    if (hideTrashTimer.current) clearTimeout(hideTrashTimer.current);
    hideTrashTimer.current = setTimeout(() => {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      hideDeleteBubble();
    }, 200);
  }, [hideDeleteBubble]);

  const showDeleteBubble = useCallback((block: Blockly.Block | null, targetField: Blockly.Field | null = null) => {
    if (!block && !targetField) return;
    let svgRoot;
    if (targetField) {
      svgRoot = targetField.getSvgRoot();
    } else if (block) {
      svgRoot = (block as Blockly.BlockSvg).getSvgRoot();
    }
    if (!svgRoot || !previewDiv.current) return;
    const relativeBlock = svgRoot.getBoundingClientRect();
    const previewRect = previewDiv.current.getBoundingClientRect();
    const topPos = relativeBlock.top - previewRect.top - 40;
    const leftPos = relativeBlock.left - previewRect.left + relativeBlock.width / 2 - 16;
    setDeleteBubblePos({ top: topPos, left: leftPos });
    setDeleteBubbleVisible(true);
  }, []);

  const onSelectionChange = useCallback(
    (event: Blockly.Events.Abstract) => {
      if (event.type === Blockly.Events.SELECTED) {
        const e = event as Blockly.Events.Selected;
        if (e.newElementId && previewWorkspace.current) {
          const block = previewWorkspace.current.getBlockById(e.newElementId);
          if (block) {
            const type = block.type;
            if (type.startsWith('arg_helper')) {
              const index = findArgIndex(block);
              if (index !== -1) {
                if (hideTrashTimer.current) clearTimeout(hideTrashTimer.current);
                setSelectedArgIndex(index);
                showDeleteBubble(block);
                return;
              }
            }
          }
        }
        scheduleHideTrash();
      }
    },
    [findArgIndex, scheduleHideTrash, showDeleteBubble],
  );

  const saveCurrentValues = useCallback(() => {
    if (!previewWorkspace.current) return;
    const main = previewWorkspace.current.getTopBlocks()[0];
    if (!main) return;
    const nameField = main.getFieldValue('NAME');
    if (nameField !== null) blockStateRef.current.mainName = nameField;
    blockStateRef.current.args.forEach((arg, index) => {
      if (arg.type === 'label') {
        const labelText = main.getFieldValue('LABEL_' + index);
        if (labelText !== null && labelText !== undefined) arg.value = labelText;
      } else {
        const input = main.getInput('ARG_' + index);
        if (input && input.connection && input.connection.targetBlock()) {
          arg.value = input.connection.targetBlock()!.getFieldValue('TEXT');
        }
      }
    });
  }, []);

  const rebuildBlock = useCallback(() => {
    if (!previewWorkspace.current) return;
    const ws = previewWorkspace.current;
    ws.clear();
    const state = blockStateRef.current;
    const uniqueBlockType = 'dyn_block_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    let msg = 'Defina %1';
    const args0: Array<{ type: string; name: string; text?: string; check?: string }> = [{ type: 'field_input', name: 'NAME', text: state.mainName }];
    state.args.forEach((arg, i) => {
      msg += ' %' + (args0.length + 1);
      if (arg.type === 'label') {
        args0.push({ type: 'field_input', name: 'LABEL_' + i, text: arg.value });
      } else {
        const check = arg.type === 'bool' ? 'Boolean' : arg.type === 'number' ? 'Number' : 'String';
        args0.push({ type: 'input_value', name: 'ARG_' + i, check: check });
      }
    });
    Blockly.defineBlocksWithJsonArray([
      {
        type: uniqueBlockType,
        message0: msg,
        args0: args0,
        nextStatement: true,
        previousStatement: true,
        inputsInline: true,
        colour: '#FF6680',
      },
    ]);
    const main = ws.newBlock(uniqueBlockType);
    main.setMovable(false);
    main.setDeletable(false);
    main.initSvg();
    main.render();
    state.args.forEach((arg, i) => {
      if (arg.type !== 'label') {
        const helperType =
          arg.type === 'input' ? 'arg_helper_string' : arg.type === 'number' ? 'arg_helper_number' : arg.type === 'bool' ? 'arg_helper_boolean' : '';
        if (helperType) {
          const child = ws.newBlock(helperType);
          child.setFieldValue(arg.value, 'TEXT');
          child.setShadow(true);
          child.initSvg();
          child.render();
          const input = main.getInput('ARG_' + i);
          if (input) input.connection?.connect(child.outputConnection);
        }
      }
    });
    const m = ws.getMetrics();
    const hw = main.getHeightWidth();
    main.moveBy(m.viewWidth / 2 - hw.width / 2, m.viewHeight / 2 - hw.height / 2);
    main.inputList.forEach((input) => {
      input.fieldRow.forEach((field) => {
        if (field.name && field.name.startsWith('LABEL_')) {
          const svgRoot = field.getSvgRoot();
          if (svgRoot) {
            Blockly.browserEvents.bind(svgRoot, 'mousedown', null, (e: Event) => {
              const mouseEvent = e as MouseEvent;
              if (mouseEvent.button !== 0) return;
              const idx = parseInt(field.name!.split('_')[1]);
              setSelectedArgIndex(idx);
              showDeleteBubble(main, field);
            });
          }
        }
      });
    });
  }, [showDeleteBubble]);

  // --- EFEITOS ---

  useEffect(() => {
    registerCustomExtensions();
    Blockly.defineBlocksWithJsonArray(CustomBlockDefinitions);
  }, []);

  useEffect(() => {
    if (isOpen && previewDiv.current) {
      if (previewWorkspace.current) previewWorkspace.current.dispose();
      previewWorkspace.current = Blockly.inject(previewDiv.current, {
        renderer: 'zelos',
        readOnly: false,
        scrollbars: false,
        trashcan: false,
        zoom: { controls: false, startScale: 1.0 },
        move: { scrollbars: false, drag: false, wheel: false },
        sounds: false,
      });
      blockStateRef.current = { mainName: 'nome do bloco', args: [] };
      rebuildBlock();
      const ws = previewWorkspace.current;
      if (ws) {
        ws.addChangeListener(onSelectionChange);
      }
    }
  }, [isOpen, rebuildBlock, onSelectionChange]);

  const handleDeleteArg = (indexOrEvent: number | React.MouseEvent) => {
    const index = typeof indexOrEvent === 'number' ? indexOrEvent : selectedArgIndex;
    if (index !== -1) {
      saveCurrentValues();
      blockStateRef.current.args.splice(index, 1);
      hideDeleteBubble();
      rebuildBlock();
    }
  };

  const addArg = (type: string, defaultValue: string) => {
    saveCurrentValues();
    blockStateRef.current.args.push({ type, value: defaultValue });
    rebuildBlock();
  };

  const handleConfirm = () => {
    if (!workspace) return;
    saveCurrentValues();
    const state = blockStateRef.current;
    const validName = state.mainName.trim() || 'função sem nome';
    const allBlocks = workspace.getAllBlocks(false);
    const nameExists = allBlocks.some((block) => {
      if (block.type.startsWith('custom_def_')) {
        const prototype = block.getInputTargetBlock('PROTOTYPE');
        if (prototype) {
          const existingName = prototype.getFieldValue('NAME');
          return existingName && existingName.trim() === validName;
        }
      }
      return false;
    });
    if (nameExists) {
      alert('Já existe uma função com esse nome.');
      return;
    }
    const uniqueID = Date.now();
    const spec = {
      id: uniqueID.toString(),
      name: validName,
      args: state.args.map((a) => ({ type: a.type, value: a.value, label: a.type === 'label' ? a.value : undefined })),
    };
    const { defBlockType, protoBlockType } = registerCustomBlockFromSpec(spec);
    // Usamos Record<string, unknown> com cast final para satisfazer o tipo ConnectionState do Blockly
    const definitionInputs: Record<string, unknown> = {};
    state.args.forEach((arg, i) => {
      if (arg.type !== 'label') {
        let reporterType = 'argument_reporter_string';
        if (arg.type === 'bool') reporterType = 'argument_reporter_boolean';
        if (arg.type === 'number') reporterType = 'argument_reporter_number';
        definitionInputs['ARG_' + i] = {
          shadow: {
            type: reporterType,
            fields: { VALUE: arg.value },
          },
        };
      }
    });
    const prototypeStructure = {
      block: {
        type: protoBlockType,
        inputs: definitionInputs as Record<string, { shadow: unknown }>,
        movable: false,
        deletable: false,
        editable: false,
      },
    };
    const blockDefJson = {
      type: defBlockType,
      inputs: { PROTOTYPE: prototypeStructure },
      editable: false,
      x: 0,
      y: 0,
    };
    const createdBlock = Blockly.serialization.blocks.append(blockDefJson as unknown as Blockly.serialization.blocks.State, workspace);
    if (createdBlock) {
      const metrics = workspace.getMetrics();
      createdBlock.moveBy(metrics.viewWidth / 2 - 100, metrics.viewHeight / 2 - 50);
      const blockSvg = createdBlock as Blockly.BlockSvg;
      blockSvg.initSvg();
      blockSvg.render();
    }
    const toolbox = workspace.getToolbox();
    if (toolbox) {
      toolbox.refreshSelection();
    }
    onClose();
  };

  if (!isOpen) return null;

  // Estilos
  const cardStyle: React.CSSProperties = {
    flex: '1 1 120px',
    minHeight: '110px',
    maxWidth: '180px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  };

  const iconBoxStyle: React.CSSProperties = {
    width: '60px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered mx-2 mx-sm-auto" style={{ maxWidth: '800px', width: 'auto' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden', isolation: 'isolate' }}>
          {/* Header */}
          <div
            className="modal-header border-0 text-white"
            style={{ backgroundColor: '#FF6680', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}
          >
            <h5 className="modal-title fw-bold">Criar um Bloco</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 bg-white">
            {/* Preview Area */}
            <div
              className="border rounded mb-4 position-relative"
              id="previewContainer"
              style={{ height: '150px', backgroundColor: 'white', overflow: 'hidden' }}
            >
              <div ref={previewDiv} style={{ width: '100%', height: '100%' }}></div>
              <div
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '20px',
                  bottom: '20px',
                  width: '6px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '3px',
                }}
              ></div>

              {/* Delete Bubble */}
              <div
                id="deleteBubble"
                style={{
                  display: deleteBubbleVisible ? 'block' : 'none',
                  position: 'absolute',
                  top: deleteBubblePos.top,
                  left: deleteBubblePos.left,
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  zIndex: 1000,
                  textAlign: 'center',
                  lineHeight: '32px',
                }}
                onClick={handleDeleteArg}
              >
                <span style={{ color: '#FF6680', fontSize: '16px', fontWeight: 'bold' }}>🗑️</span>
              </div>
            </div>

            {/* Options Cards */}
            <div className="d-flex flex-wrap justify-content-center justify-content-sm-between gap-2 gap-sm-3 mb-4">
              {/* Number */}
              <div className="card-option" style={cardStyle} onClick={() => addArg('number', 'Número')}>
                <div style={iconBoxStyle}>
                  <div
                    style={{
                      width: '50px',
                      height: '30px',
                      backgroundColor: '#FFB3C6',
                      borderRadius: '15px',
                      color: '#D60036',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    número
                  </div>
                </div>
                <div className="fw-bold small text-dark">Adicionar entrada</div>
                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  número
                </div>
              </div>
              {/* Text */}
              <div className="card-option" style={cardStyle} onClick={() => addArg('input', 'Texto')}>
                <div style={iconBoxStyle}>
                  <div
                    style={{
                      width: '50px',
                      height: '30px',
                      backgroundColor: '#FFB3C6',
                      borderRadius: '4px',
                      color: '#D60036',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    texto
                  </div>
                </div>
                <div className="fw-bold small text-dark">Adicionar entrada</div>
                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  texto
                </div>
              </div>
              {/* Boolean */}
              <div className="card-option" style={cardStyle} onClick={() => addArg('bool', 'Booleano')}>
                <div style={iconBoxStyle}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: '#FFB3C6',
                      transform: 'rotate(45deg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  ></div>
                </div>
                <div className="fw-bold small text-dark">Adicionar entrada</div>
                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  booleana
                </div>
              </div>
              {/* Label */}
              <div className="card-option" style={cardStyle} onClick={() => addArg('label', 'Rótulo')}>
                <div style={iconBoxStyle}>
                  <div
                    style={{
                      width: '50px',
                      height: '30px',
                      backgroundColor: '#FFB3C6',
                      borderRadius: '4px',
                      color: '#D60036',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    rótulo
                  </div>
                </div>
                <div className="fw-bold small text-dark">Adicionar rótulo</div>
              </div>
            </div>

            {/* Checkbox */}
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="screenRefreshCheck"
                checked={screenRefresh}
                onChange={(e) => setScreenRefresh(e.target.checked)}
              />
              <label className="form-check-label text-secondary" htmlFor="screenRefreshCheck">
                Executar sem atualização de tela
              </label>
            </div>
          </div>

          {/* Footer */}
          <div
            className="modal-footer border-top-0 p-3 bg-white d-flex justify-content-end gap-2"
            style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}
          >
            <button
              type="button"
              className="btn btn-secondary px-4 rounded-pill"
              style={{ backgroundColor: '#E0E0E0', border: 'none', color: '#555' }}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary px-4 rounded-pill fw-bold"
              style={{ backgroundColor: '#FF6680', borderColor: '#FF6680' }}
              onClick={handleConfirm}
            >
              OK
            </button>
          </div>
        </div>
      </div>
      <style>{`
                .card-option:hover {
                    border-color: #FF6680;
                    background-color: #FFF0F5;
                }
            `}</style>
    </div>
  );
}
