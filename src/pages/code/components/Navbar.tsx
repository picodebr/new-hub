/**
 * Barra de navegação principal com controles de projeto (Salvar, Abrir, Conectar).
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { arduinoGenerator } from '@/_base/generators/board';
import { IBlocklyWorkspaceJson } from '@/_base/domain/entities';
import RocketLoader from './shared/RocketLoader';
import SerialMonitor from './serial/SerialMonitor';
import ToolsModal from './shared/ToolsModal';
import { useExecutionRunner } from '@/_base/context/ExecutionRunnerContext';
import { useUI } from '@/_base/context/UIContext';
import { useProject } from '@/_base/context/ProjectContext';
import { useFirmware } from '@/_base/context/FirmwareContext';
import { IProjectContextUI, SerializationService } from '@/_base/services/code';
import { useCustomRouter, useCustomToast } from '@/_base/hooks';
import { FiLogOut } from 'react-icons/fi';
import { ICodeProject } from '@/_base/interfaces/codeProject/IProject';

interface IProps {
  project: ICodeProject | null;
}

export default function CodeNavbar({ project }: IProps) {
  // Contextos globais para gerenciar o estado do palco e da conexão serial
  const runnerContext = useExecutionRunner();
  const uiContext = useUI();
  const projectContext = useProject();

  const router = useCustomRouter();
  const toast = useCustomToast();

  // UI states from UIContext
  const { isUploadMode, setIsUploadMode, rocketPhase, showRocket, isUploading, isBusy, rocketErrorMessage } = uiContext;

  // Firmware Context
  const { isSerialConnected, connectSerial, disconnectSerial, uploadSketch } = useFirmware();

  // Estados locais para modais específicos
  const [showTools, setShowTools] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);

  // Estado auxiliar para controle visual do botão de upload
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estado para detectar React Native
  const [isReactNative, setIsReactNative] = useState(false);

  // Helpers de Estado Visual
  const isConnecting = false;
  const isActive = isSerialConnected || isConnecting || isBusy || isUploading || isUploadingLocal;

  // Referência para o input de arquivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detectar React Native no mount
  useEffect(() => {
    const webview = (window as any).ReactNativeWebView;
    setIsReactNative(!!webview);
  }, []);

  // Adapter to decouple SerializationService from React Contexts
  const contextAdapter: IProjectContextUI = {
    projectId: project?.id,
    projectName: project?.name,
    isUploadMode: uiContext.isUploadMode,
    uploadModeBlocks: uiContext.uploadModeBlocks,
    uploadCode: uiContext.uploadCode,
    setIsUploadMode: setIsUploadMode,
    setUploadModeBlocks: uiContext.setUploadModeBlocks,
    setUploadCode: uiContext.setUploadCode,
    backdrops: projectContext.backdrops,
    activeBackdropId: projectContext.activeBackdropId,
    activeSpriteId: projectContext.activeSpriteId,
    activeExtensions: uiContext.activeExtensions,
    setActiveExtensions: uiContext.setActiveExtensions,
    activeStageMLModel: projectContext.activeStageMLModel,
    setActiveStageMLModel: projectContext.setActiveStageMLModel,
    activeUploadMLModel: projectContext.activeUploadMLModel,
    setActiveUploadMLModel: projectContext.setActiveUploadMLModel,
  };

  useEffect(() => {
    if (!project) return;

    const rawMeta = (project?.metadata as any)?.sprites
      ? project.metadata
      : (project?.metadata as any)?.metadata?.sprites
      ? (project.metadata as any).metadata
      : project?.metadata;

    if (!rawMeta || (!rawMeta.sprites && !rawMeta.uploadMode)) {
      SerializationService.resetProject(contextAdapter);
      return;
    }

    SerializationService.loadProject(rawMeta, contextAdapter);
  }, [project]);

  /**
   * Alterna entre modo Palco e modo Upload salvando o estado do workspace atual
   */
  const handleModeSwitch = (targetUploadMode: boolean) => {
    if (targetUploadMode === isUploadMode) return;
    const ws = runnerContext.blocklyWorkspaceRef?.current?.getWorkspace?.();
    if (ws) {
      const json = Blockly.serialization.workspaces.save(ws) as unknown as IBlocklyWorkspaceJson;
      const blocksJson: IBlocklyWorkspaceJson = {
        blocks: json.blocks || { languageVersion: 0, blocks: [] },
        variables: json.variables,
      };
      if (isUploadMode) {
        const code = arduinoGenerator.workspaceToCode(ws);
        uiContext.setUploadModeBlocks(blocksJson);
        uiContext.setUploadCode(code);
      } else {
        const code = javascriptGenerator.workspaceToCode(ws);
        projectContext.updateSpriteBlocks(projectContext.activeSpriteId, blocksJson, code);
      }
    }
    setIsUploadMode(targetUploadMode);
  };

  /**
   * Lida com a exportação do projeto atual para a API.
   */
  const handleSaveProject = async () => {
    if (!project || isSaving) return;

    try {
      setIsSaving(true);
      const workspace = runnerContext.blocklyWorkspaceRef?.current?.getWorkspace?.();
      await SerializationService.saveProject(contextAdapter, project, 'meu_projeto.json', workspace || undefined);
      toast({ title: 'Projeto salvo com sucesso!', status: 'success' });
    } catch (err) {
      console.error('[Navbar] Erro ao salvar:', err);
      toast({
        title: 'Erro ao salvar projeto',
        description: 'Não foi possível salvar os dados no servidor.',
        status: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Processa o arquivo selecionado pelo usuário e carrega os blocos no workspace.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    SerializationService.handleFileSelect(e, contextAdapter);
    if (e.target) e.target.value = '';
  };

  /**
   * Inicia o processo de compilação e upload do código para a placa.
   */
  const handleUpload = async () => {
    if (!isUploadMode) {
      alert('Vá para o modo Upload.');
      return;
    }

    await uploadSketch();
  };

  /**
   * Trata o clique no botão de conectar
   */
  const handleConnectClick = async () => {
    if (isReactNative) {
      try {
        await connectSerial();
      } catch (err) {
        console.error('[Navbar] Erro ao conectar em React Native:', err);
        toast({
          title: 'Erro ao conectar',
          description: 'Não foi possível conectar à porta serial. Verifique se o dispositivo está conectado.',
          status: 'error',
        });
      }
    } else {
      try {
        await connectSerial();
      } catch (err) {
        console.error('[Navbar] Erro ao conectar:', err);
        toast({
          title: 'Erro ao conectar',
          description: 'Não foi possível selecionar a porta serial.',
          status: 'error',
        });
      }
    }
  };

  return (
    <>
      <nav
        className="navbar navbar-expand px-3 py-2"
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e8e8e8',
          height: '60px',
          maxHeight: '60px',
          minHeight: '60px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="container-fluid p-0 d-flex align-items-center justify-content-between h-100 position-relative">
          {/* Esquerda: Logo PiCode Education + Conectar + Salvar */}
          <div className="d-flex align-items-center gap-3">
            <a className="navbar-brand d-flex align-items-center m-0 p-0" href="#" onClick={(e) => e.preventDefault()}>
              <img
                src="/logo/picode-logo-full-bluedark.svg"
                alt="PiCode Education"
                style={{ height: '36px', width: 'auto', display: 'block' }}
              />
            </a>

            {/* Botão de Conectar/Desconectar USB */}
            <button
              className="btn btn-sm d-flex align-items-center gap-2"
              onClick={isSerialConnected ? disconnectSerial : handleConnectClick}
              disabled={false}
              title={isSerialConnected ? 'Clique para desconectar' : isReactNative ? 'Conectar via React Native' : 'Clique para conectar'}
              style={{
                backgroundColor: isActive ? '#22c55e' : '#f1f5f9',
                color: isActive ? '#fff' : '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              <i className={`bi ${isActive ? 'bi-usb-plug-fill' : 'bi-usb-plug'}`} style={{ fontSize: '14px' }}></i>
              {isSerialConnected || isUploading || isUploadingLocal || isBusy ? 'Conectado' : 'Conectar'}
            </button>

            {/* Botão Salvar */}
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              onClick={handleSaveProject}
              disabled={isSaving}
              style={{
                backgroundColor: '#4483ff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                opacity: isSaving ? 0.7 : 1,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-1" style={{ fontSize: '14px' }}></i> Salvar
                </>
              )}
            </button>

            {/* Input de Arquivos Escondido */}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".piboard,.json" onChange={handleFileChange} />
          </div>

          {/* Centro Absoluto: Nome do Projeto */}
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          >
            <div
              className="px-4 py-1 text-center"
              style={{
                backgroundColor: '#f1f5f9',
                color: '#131432',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 600,
                maxWidth: '280px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project ? project.name : 'Carregando...'}
            </div>
          </div>

          {/* Direita: Monitores, Carregar, Alternador Palco/Upload, Sair */}
          <div className="d-flex align-items-center gap-3">
            {/* Botão Monitores (Apenas no modo Upload) */}
            {isUploadMode && (
              <button
                className="btn btn-sm d-flex align-items-center gap-2"
                onClick={() => setShowTools(true)}
                title="Ferramentas e Monitores"
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontWeight: 500,
                }}
              >
                <i className="bi bi-speedometer2" style={{ fontSize: '14px' }}></i> Monitores
              </button>
            )}

            {/* Botão Carregar (Apenas no modo Upload) */}
            {isUploadMode && (
              <button
                className="btn btn-sm fw-semibold d-flex align-items-center gap-1"
                onClick={() => {
                  setIsUploadingLocal(true);
                  handleUpload().finally(() => setIsUploadingLocal(false));
                }}
                disabled={isUploadingLocal || isUploading || !isSerialConnected}
                title={!isSerialConnected ? 'Conecte a placa primeiro' : ''}
                style={{
                  backgroundColor: !isSerialConnected ? '#94a3b8' : '#0047b3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  cursor: !isSerialConnected ? 'not-allowed' : 'pointer',
                }}
              >
                {isUploadingLocal ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2"></span>Enviando...
                  </span>
                ) : (
                  <span>
                    <i className="bi bi-lightning-fill me-1" style={{ fontSize: '14px' }}></i> Carregar
                  </span>
                )}
              </button>
            )}

            {/* Alternador de Modo (Palco vs Upload) */}
            <div
              className="d-flex align-items-center"
              style={{
                backgroundColor: '#f1f5f9',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '4px',
              }}
            >
              <button
                className="btn btn-sm px-3 fw-semibold d-flex align-items-center gap-2"
                onClick={() => handleModeSwitch(false)}
                style={{
                  backgroundColor: !isUploadMode ? '#131432' : 'transparent',
                  color: !isUploadMode ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  padding: '4px 12px',
                }}
              >
                <i className="bi bi-play-circle-fill" style={{ fontSize: '14px' }}></i> Palco
              </button>
              <button
                className="btn btn-sm px-3 fw-semibold d-flex align-items-center gap-2"
                onClick={() => handleModeSwitch(true)}
                style={{
                  backgroundColor: isUploadMode ? '#131432' : 'transparent',
                  color: isUploadMode ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  padding: '4px 12px',
                }}
              >
                <i className="bi bi-cpu-fill" style={{ fontSize: '14px' }}></i> Upload
              </button>
            </div>

            {/* Botão Sair */}
            <button
              type="button"
              className="btn btn-link p-0 d-flex align-items-center justify-content-center"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                color: '#D92D20',
                textDecoration: 'none',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee4e2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                router.back();
              }}
              title="Sair do editor"
            >
              <FiLogOut style={{ fontSize: '18px', color: '#D92D20' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Modais e Overlays de Carregamento */}
      <RocketLoader isVisible={showRocket} phase={rocketPhase} errorMessage={rocketErrorMessage} />

      {/* Modal de Ferramentas de Sensores */}
      <ToolsModal
        isOpen={showTools}
        onClose={() => setShowTools(false)}
        onOpenSerial={() => {
          setShowTools(false);
          setShowMonitor(true);
        }}
      />

      {/* Monitor Serial (Terminal) */}
      <SerialMonitor
        isOpen={showMonitor}
        onClose={() => setShowMonitor(false)}
        onBack={() => {
          setShowMonitor(false);
          setShowTools(true);
        }}
      />
    </>
  );
}
