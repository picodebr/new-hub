/**
 * UIContext - Gestão de estados visuais e navegação global da plataforma.
 * 
 * Responsabilidade: Centralizar estados que controlam a aparência, navegação 
 * entre abas (Código, Fantasias) e visibilidade de componentes de interface 
 * globais, como o progresso do upload e avisos de segurança da rede serial.
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { IBlocklyWorkspaceJson } from '../domain/entities';

export interface UIContextType {
    // Mode Toggles
    isUploadMode: boolean;
    setIsUploadMode: (mode: boolean) => void;

    // Blockly State Storage (For Mode Switching)
    uploadModeBlocks: IBlocklyWorkspaceJson | null;
    setUploadModeBlocks: (blocks: IBlocklyWorkspaceJson | null) => void;
    uploadCode: string;
    setUploadCode: (code: string) => void;

    // Loading / Block State
    isBusy: boolean;
    setIsBusy: (busy: boolean) => void;

    // Rocket / Upload Animation UI
    rocketPhase: 'ready' | 'compiling' | 'flying' | 'success' | 'failure' | '';
    setRocketPhase: (phase: 'ready' | 'compiling' | 'flying' | 'success' | 'failure' | '') => void;
    rocketErrorMessage: string;
    setRocketErrorMessage: (msg: string) => void;
    showRocket: boolean;
    setShowRocket: (show: boolean) => void;
    isUploading: boolean;
    setIsUploading: (uploading: boolean) => void;

    // Active Extensions (Global State)
    activeExtensions: string[];
    setActiveExtensions: React.Dispatch<React.SetStateAction<string[]>>;

    // Tab Management
    activeTab: 'code' | 'costumes' | 'sounds';
    setActiveTab: (tab: 'code' | 'costumes' | 'sounds') => void;

    // Full Screen Stage
    isStageFullScreen: boolean;
    setIsStageFullScreen: (fullscreen: boolean) => void;

    // Safety Modals
    showBoardConnectionWarning: boolean;
    setShowBoardConnectionWarning: (show: boolean) => void;
    showDeviceLostWarning: boolean;
    setShowDeviceLostWarning: (show: boolean) => void;
    showRestoreConfirmModal: boolean;
    setShowRestoreConfirmModal: (show: boolean) => void;
    showUploadTimeoutModal: boolean;
    setShowUploadTimeoutModal: (show: boolean) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isUploadMode, setIsUploadMode] = useState(false);
    const [uploadModeBlocks, setUploadModeBlocks] = useState<IBlocklyWorkspaceJson | null>(null);
    const [uploadCode, setUploadCode] = useState<string>("");

    const [isBusy, setIsBusy] = useState(false);

    const [rocketPhase, setRocketPhase] = useState<'ready' | 'compiling' | 'flying' | 'success' | 'failure' | ''>('');
    const [rocketErrorMessage, setRocketErrorMessage] = useState('');
    const [showRocket, setShowRocket] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeExtensions, setActiveExtensions] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'code' | 'costumes' | 'sounds'>('code');
    // Full Screen Stage
    const [isStageFullScreen, setIsStageFullScreen] = useState(false);
    // CONTROLE DE MODAL DE SEGURANÇA:
    // Exibido quando blocos de hardware são detectados em modo simulação.
    const [showBoardConnectionWarning, setShowBoardConnectionWarning] = useState(false);
    // Exibido quando a conexão com a placa é perdida inesperadamente.
    const [showDeviceLostWarning, setShowDeviceLostWarning] = useState(false);
    // Exibido quando a placa precisa ser restaurada (Interagir Placa).
    const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
    // Exibido quando ocorre timeout no upload/restauro da placa.
    const [showUploadTimeoutModal, setShowUploadTimeoutModal] = useState(false);

    // --- EFFECT: Sincronização de Classes de CSS no Body ---
    // Injeta classes dinâmicas no <body> para permitir que o CSS global 
    // reaja à mudança drástica de layout entre o modo Stage (Padrão Scratch) 
    // e o modo Upload (Programação em C++ para a placa).
    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (isUploadMode) {
                document.body.classList.add('upload-mode');
                document.body.classList.remove('stage-mode');
            } else {
                document.body.classList.add('stage-mode');
                document.body.classList.remove('upload-mode');
            }
        }
        return () => {
            if (typeof document !== 'undefined') {
                document.body.classList.remove('stage-mode', 'upload-mode');
            }
        };
    }, [isUploadMode]);

    const value: UIContextType = useMemo(() => ({
        isUploadMode,
        setIsUploadMode,
        uploadModeBlocks,
        setUploadModeBlocks,
        uploadCode,
        setUploadCode,
        isBusy,
        setIsBusy,
        rocketPhase,
        setRocketPhase,
        rocketErrorMessage,
        setRocketErrorMessage,
        showRocket,
        setShowRocket,
        isUploading,
        setIsUploading,
        activeExtensions,
        setActiveExtensions,
        activeTab,
        setActiveTab,
        isStageFullScreen,
        setIsStageFullScreen,
        showBoardConnectionWarning,
        setShowBoardConnectionWarning,
        showDeviceLostWarning,
        setShowDeviceLostWarning,
        showRestoreConfirmModal,
        setShowRestoreConfirmModal,
        showUploadTimeoutModal,
        setShowUploadTimeoutModal
    }), [
        isUploadMode, uploadModeBlocks, uploadCode, isBusy, rocketPhase, 
        rocketErrorMessage, showRocket, isUploading, activeExtensions, 
        activeTab, isStageFullScreen, showBoardConnectionWarning,
        showDeviceLostWarning, showRestoreConfirmModal, showUploadTimeoutModal
    ]);

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
}
