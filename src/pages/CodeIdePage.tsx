import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  Maximize2,
  Minimize2,
  Code,
  Layers,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Cpu,
} from 'lucide-react';
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

  const { handleRun, handleStop } = useCodeExecution(blocklyRef);

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
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      {/* Code Navbar */}
      <CodeNavbar project={project} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Area: Blockly Workspace or Full Monaco */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <BlocklyWorkspace ref={blocklyRef} />

          {/* Floating Toggle for Code Preview in Upload Mode */}
          {isUploadMode && (
            <button
              type="button"
              onClick={() => setIsCodePanelOpen(!isCodePanelOpen)}
              className="absolute right-4 top-3 z-40 p-2.5 rounded-xl bg-card border border-border shadow-md hover:bg-accent text-foreground transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <Code className="w-4 h-4 text-primary" />
              <span>{isCodePanelOpen ? 'Ocultar C++' : 'Ver Código C++'}</span>
            </button>
          )}

          {/* Code Preview Drawer / Overlay */}
          <AnimatePresence>
            {isUploadMode && isCodePanelOpen && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute top-0 right-0 bottom-0 w-[420px] max-w-full z-30 shadow-2xl border-l border-border bg-card flex flex-col"
              >
                <div className="p-3 border-b border-border flex items-center justify-between bg-muted/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-primary" /> Código Arduino C++
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCodePanelOpen(false)}
                    className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition-colors text-xs"
                  >
                    Fechar
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodePreview />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Stage & Management Column (Visible when not in Upload Mode) */}
        {!isUploadMode && (
          <div
            className={`w-[440px] max-w-full flex flex-col border-l border-border/60 bg-muted/20 transition-all ${
              isStageFullScreen
                ? 'fixed inset-0 z-50 w-screen h-screen bg-background p-6'
                : 'h-full p-3'
            }`}
          >
            {/* Stage Controls Bar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRun}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    runnerContext.isAnyCodeRunning
                      ? 'bg-emerald-600/20 text-emerald-600'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  }`}
                  title="Executar no Palco"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
                <button
                  type="button"
                  onClick={handleStop}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    runnerContext.isAnyCodeRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                  title="Parar Execução"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStageFullScreen(!isStageFullScreen)}
                  className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title={isStageFullScreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                >
                  {isStageFullScreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Stage Canvas Area */}
            <div className="flex-1 min-h-[260px] max-h-[320px] rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm mb-3">
              <StageArea />
            </div>

            {/* Sprites & Backdrops Management List */}
            <div className="flex-1 flex flex-col rounded-2xl border border-border/60 bg-card/60 p-3 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Atores & Cenários
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SpriteList />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Background Stage Bridge communication */}
      <StageBridge />

      {/* Machine Learning Recognition Floating Overlay Window */}
      {isRecognitionWindowOpen && (
        <MLRecognitionWindow
          isOpen={isRecognitionWindowOpen}
          onClose={() => setIsRecognitionWindowOpen(false)}
        />
      )}

      {/* Global Modals */}
      <BoardConnectionWarningModal />
      <DeviceLostModal />
      <RestoreConfirmModal />
      <UploadTimeoutModal />
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
