/**
 * Estado e lógica para o processo de upload de firmware para a placa.
 */
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useHardwareManager } from '../hooks/Code/useHardwareManager';
import { UploadFirmwareUseCase } from '../use-cases/UploadFirmwareUseCase';
import { IHardwareBoard } from '../domain/ports/IHardwareBoard';
import { ISerialPort } from '../domain/entities';
import { useUI } from './UIContext';

export interface FirmwareContextType {
  // Hardware Board Integration
  board: IHardwareBoard;
  serialPort: ISerialPort | null;
  isSerialConnected: boolean;

  // Serial Controls
  connectSerial: (explicitPort?: ISerialPort) => Promise<void>;
  disconnectSerial: () => Promise<void>;

  // Hardware Operations
  uploadSketch: () => Promise<void>;
  restoreBoard: () => Promise<void>;
}

const FirmwareContext = createContext<FirmwareContextType | null>(null);

export function FirmwareProvider({ children }: { children: ReactNode }) {
  const { uploadCode, setIsBusy, setIsUploading, setShowRocket, setRocketErrorMessage, setRocketPhase, setShowUploadTimeoutModal } = useUI();

  // Hardware state
  const hardware = useHardwareManager(false); // Simplified to avoid potential context updates during action triggers

  const uploadSketch = useCallback(async () => {
    setIsBusy(true);
    setIsUploading(true);
    setShowRocket(true);
    setRocketErrorMessage('');

    console.log(`[Upload] Enviando código C++ para a placa:\n${uploadCode}`);

    try {
      await UploadFirmwareUseCase.execute(
        uploadCode,
        {
          isSerialConnected: hardware.isSerialConnected,
          currentPort: hardware.serialPort,
          disconnectSerial: hardware.disconnectSerial,
          connectSerial: hardware.connectSerial,
        },
        {
          onPhaseChange: (phase) => {
            setRocketPhase(phase);
            if (phase === 'success' || phase === 'failure') {
              setTimeout(() => {
                setShowRocket(false);
                setTimeout(() => setRocketPhase(''), 1200);
              }, 4500);
            } else if (phase === '') {
              setShowRocket(false);
              setRocketPhase('');
            }
          },
          onError: (msg) => setRocketErrorMessage(msg),
          onTimeout: () => setShowUploadTimeoutModal(true),
        },
      );
    } finally {
      setIsUploading(false);
      setIsBusy(false);
    }
  }, [
    hardware.connectSerial,
    hardware.disconnectSerial,
    hardware.isSerialConnected,
    hardware.serialPort,
    setIsBusy,
    setIsUploading,
    setRocketErrorMessage,
    setRocketPhase,
    setShowRocket,
    uploadCode,
    setShowUploadTimeoutModal,
  ]);

  const restoreBoard = useCallback(async () => {
    setIsBusy(true);
    setIsUploading(true);
    setShowRocket(true);
    setRocketErrorMessage('');

    try {
      await UploadFirmwareUseCase.restore(
        {
          isSerialConnected: hardware.isSerialConnected,
          currentPort: hardware.serialPort,
          disconnectSerial: hardware.disconnectSerial,
          connectSerial: hardware.connectSerial,
        },
        {
          onPhaseChange: (phase) => {
            setRocketPhase(phase);
            if (phase === 'success' || phase === 'failure') {
              setTimeout(() => {
                setShowRocket(false);
                setTimeout(() => setRocketPhase(''), 1200);
              }, 4500);
            } else if (phase === '') {
              setShowRocket(false);
              setRocketPhase('');
            }
          },
          onError: (msg) => setRocketErrorMessage(msg),
          onTimeout: () => setShowUploadTimeoutModal(true),
        },
      );
    } finally {
      setIsUploading(false);
      setIsBusy(false);
    }
  }, [
    hardware.connectSerial,
    hardware.disconnectSerial,
    hardware.isSerialConnected,
    hardware.serialPort,
    setIsBusy,
    setIsUploading,
    setRocketErrorMessage,
    setRocketPhase,
    setShowRocket,
  ]);

  const value: FirmwareContextType = useMemo(
    () => ({
      board: hardware.board,
      serialPort: hardware.serialPort as ISerialPort | null,
      isSerialConnected: hardware.isSerialConnected,
      connectSerial: hardware.connectSerial,
      disconnectSerial: hardware.disconnectSerial,
      uploadSketch,
      restoreBoard,
    }),
    [hardware, uploadSketch, restoreBoard],
  );

  return <FirmwareContext.Provider value={value}>{children}</FirmwareContext.Provider>;
}

export function useFirmware() {
  const context = useContext(FirmwareContext);
  if (!context) {
    throw new Error('useFirmware must be used within a FirmwareProvider');
  }
  return context;
}
