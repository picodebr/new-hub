import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CombinedProviders } from '@/_base/context/CombinedProviders';
import { useUI } from '@/_base/context/UIContext';
import { useFirmware } from '@/_base/context/FirmwareContext';
import { useProject } from '@/_base/context/ProjectContext';
import { useExecutionRunner } from '@/_base/context/ExecutionRunnerContext';
import { useCodeExecution } from '@/_base/hooks/Code/useCodeExecution';
import { getCodeProject } from '@/_base/services/codeProject';
import { ICodeProject } from '@/_base/interfaces/codeProject/IProject';
import { BlocklyWorkspaceRef } from '@/_base/domain/entities';

import CodeNavbar from './code/components/Navbar';
import BlocklyWorkspace from './code/components/blockly/BlocklyWorkspace';
import CodePreview from './code/components/CodePreview';
import StageArea from './code/components/stage/StageArea';
import SpriteList from './code/components/sprites/SpriteList';
import StageBridge from './code/components/stage/StageBridge';
import { MLRecognitionWindow } from './code/components/ml/MLRecognitionWindow';
import { BoardConnectionWarningModal } from './code/components/modals/BoardConnectionWarningModal';
import { DeviceLostModal } from './code/components/modals/DeviceLostModal';
import { RestoreConfirmModal } from './code/components/modals/RestoreConfirmModal';
import { UploadTimeoutModal } from './code/components/modals/UploadTimeoutModal';

function CodeIdeContent() {
  const { folderId, projectId } = useParams<{ folderId: string; projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ICodeProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);

  const blocklyRef = useRef<BlocklyWorkspaceRef | null>(null);

  const {
    isUploadMode,
    activeExtensions,
    isStageFullScreen,
    setIsStageFullScreen,
    setShowRestoreConfirmModal,
    setActiveTab,
  } = useUI();

  const { isSerialConnected, restoreBoard } = useFirmware();
  const { isRecognitionWindowOpen, setIsRecognitionWindowOpen } = useProject();
  const runnerContext = useExecutionRunner();
  const { setBlocklyWorkspaceRef } = runnerContext;

  useEffect(() => {
    setActiveTab('code');
  }, [setActiveTab]);

  useEffect(() => {
    setBlocklyWorkspaceRef(blocklyRef);
  }, [setBlocklyWorkspaceRef]);

  const { handleRun, handleStop, handleBlockClick, handleRunCode } = useCodeExecution(blocklyRef);

  // Fetch project details
  useEffect(() => {
    if (!projectId) return;

    let mounted = true;
    const fetchProj = async () => {
      try {
        const data = await getCodeProject(projectId);
        if (mounted && data) {
          setProject(data);
        }
      } catch (err) {
        console.warn('Usando projeto inicial local:', err);
        if (mounted) {
          setProject({
            id: projectId,
            name: 'Meu Projeto Robótica',
            folder_id: folderId || '1',
            metadata: {
              settings: { mode: 'stage' },
              sprites: [],
            },
            source_code: {
              code: '',
              mode: 'block',
              simulation_elements_layout: [],
              variables: [],
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProj();
    return () => {
      mounted = false;
    };
  }, [projectId, folderId]);

  useEffect(() => {
    if (isUploadMode) {
      handleStop();
    }
  }, [isUploadMode, handleStop]);

  useEffect(() => {
    const handleConfirmRestore = () => {
      handleStop();
      restoreBoard();
    };

    window.addEventListener('confirm-restore-board', handleConfirmRestore);
    return () => window.removeEventListener('confirm-restore-board', handleConfirmRestore);
  }, [handleStop, restoreBoard]);

  return (
    <div
      className="main-ide-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 100,
        backgroundColor: '#fff',
      }}
    >
      <CodeNavbar project={project} />

      <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ position: 'relative' }}>
        <StageBridge />

        <div className="container-fluid flex-grow-1 d-flex flex-column px-0" style={{ overflow: 'hidden' }}>
          <div className="d-flex h-100 flex-nowrap w-100">
            {/* BLOCKLY CONTAINER */}
            <div
              className="p-0"
              id="blockly-container"
              style={{
                minWidth: 0,
                border: 'none',
              }}
            >
              <BlocklyWorkspace ref={blocklyRef} onBlockClick={handleBlockClick} onRunCode={handleRunCode} />
            </div>

            {!isUploadMode && (
              <MLRecognitionWindow
                isOpen={isRecognitionWindowOpen}
                onClose={() => setIsRecognitionWindowOpen(false)}
              />
            )}

            <BoardConnectionWarningModal />
            <DeviceLostModal />
            <RestoreConfirmModal />
            <UploadTimeoutModal />

            <CodePreview
              isOpen={isCodePanelOpen}
              isUploadMode={isUploadMode}
              onToggle={() => setIsCodePanelOpen(false)}
            />

            {/* Floating button C++ / Arduino preview (Mode Upload) */}
            <button
              className="btn shadow-sm position-absolute d-flex align-items-center justify-content-center"
              style={{
                right: '15px',
                top: '10px',
                width: '45px',
                height: '45px',
                borderRadius: '12px',
                zIndex: 1000,
                backgroundColor: '#131432',
                border: 'none',
                color: '#fff',
                opacity: isUploadMode && !isCodePanelOpen ? 1 : 0,
                transform: isUploadMode && !isCodePanelOpen ? 'scale(1)' : 'scale(0.5)',
                pointerEvents: isUploadMode && !isCodePanelOpen ? 'all' : 'none',
                transition: 'all 0.3s ease',
              }}
              onClick={() => setIsCodePanelOpen(true)}
              title="Ver Código C++"
            >
              <i className="bi bi-code-slash" style={{ fontSize: '1.2rem' }}></i>
            </button>

            {/* RIGHT PANEL: STAGE & MANAGEMENT */}
            <div
              className="p-0"
              id="right-panel"
              style={{
                opacity: isUploadMode ? 0 : 1,
                pointerEvents: isUploadMode ? 'none' : 'auto',
                overflow: isUploadMode ? 'hidden' : undefined,
                flex: isUploadMode ? '0 0 0' : undefined,
                backgroundColor: '#e9eef2',
                minWidth: 0,
                display: isUploadMode ? 'none' : 'flex',
                flexDirection: 'column',
                paddingLeft: '12px',
                paddingRight: '12px',
                paddingTop: '0px',
              }}
            >
              {!isUploadMode && (
                <>
                  <div
                    className={`stage-section d-flex flex-column ${
                      isStageFullScreen ? 'align-items-center fullscreen' : 'align-items-start'
                    } w-100`}
                    style={{ flex: '0 0 auto', backgroundColor: '#e9eef2' }}
                  >
                    <div
                      className="stage-header w-100 d-flex align-items-center px-3"
                      style={{ backgroundColor: '#e9eef2', minHeight: '52px' }}
                    >
                      <div className="d-flex align-items-center justify-content-start" style={{ flex: 1 }}>
                        <div className="stage-controls d-flex align-items-center mb-0 gap-3">
                          <button
                            id="btnGo"
                            className={`btn btn-link p-0 btn-go d-flex align-items-center ${
                              runnerContext.isAnyCodeRunning ? 'inactive' : 'active'
                            }`}
                            title="Play"
                            onClick={(e) => {
                              handleRun();
                              e.currentTarget.blur();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === ' ') e.preventDefault();
                            }}
                          >
                            <i className="bi bi-play-fill" style={{ fontSize: '1.8rem' }}></i>
                          </button>
                          <button
                            id="btnStop"
                            className={`btn btn-link p-0 btn-stop d-flex align-items-center ${
                              runnerContext.isAnyCodeRunning ? 'active' : 'inactive'
                            }`}
                            title="Parar"
                            onClick={(e) => {
                              handleStop();
                              e.currentTarget.blur();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === ' ') e.preventDefault();
                            }}
                          >
                            <i className="bi bi-octagon-fill" style={{ fontSize: '1.4rem' }}></i>
                          </button>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-end gap-3" style={{ flex: 1 }}>
                        <button
                          id="btnMaximize"
                          className="btn btn-link p-0 d-flex align-items-center text-secondary"
                          title={isStageFullScreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                          style={{ transition: 'color 0.2s' }}
                          onClick={(e) => {
                            setIsStageFullScreen(!isStageFullScreen);
                            e.currentTarget.blur();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === ' ') e.preventDefault();
                          }}
                        >
                          <i
                            className={`bi ${isStageFullScreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}
                            style={{ fontSize: '1.1rem' }}
                          ></i>
                        </button>
                        {activeExtensions.includes('piboard') && (
                          <button
                            id="btnInteractBoard"
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center py-0 px-2 flex-shrink-0"
                            style={{ fontSize: '0.75rem', borderRadius: '20px', backgroundColor: '#fff' }}
                            onClick={() => {
                              if (!isSerialConnected) {
                                alert('Conecte a placa primeiro clicando no ícone de USB na barra superior.');
                                return;
                              }
                              setShowRestoreConfirmModal(true);
                            }}
                            title={
                              isSerialConnected
                                ? 'Clique para restaurar novamente'
                                : 'Clique para interagir (Restaurar Firmware)'
                            }
                          >
                            <i
                              className={`bi ${isSerialConnected ? 'bi-usb-plug-fill' : 'bi-usb-plug'} me-1`}
                              style={{ color: isSerialConnected ? '#22c55e' : 'inherit', fontSize: '1rem' }}
                            ></i>
                            <span>Interagir Placa</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <StageArea />
                  </div>

                  <div className="management-section flex-grow-1 d-flex flex-column">
                    <SpriteList />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CodeIdePage() {
  return (
    <CombinedProviders>
      <CodeIdeContent />
    </CombinedProviders>
  );
}
