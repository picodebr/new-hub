/**
 * SerialContext - Gestão do estado da conexão física via Web Serial.
 *
 * Responsabilidade: Gerenciar o ciclo de vida do link USB com a placa controladora.
 * Abstrai a complexidade do handshake serial e monitora o status da porta em tempo
 * real (conectado, desconectado, erro), expondo a camada de comando (`board`).
 *
 * Operações Principais:
 * - connect/disconnect: Fluxo de controle para solicitação e fechamento da porta física.
 * - Gestão centralizada do status de conexão para toda a aplicação.
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { SerialStatus, ISerialPort } from '../domain/entities';
import { IHardwareBoard } from '../domain/ports/IHardwareBoard';
import { getSerialService, SerialService } from '../services/code';

interface SerialContextType {
  isConnected: boolean;
  status: SerialStatus;
  serialPort: ISerialPort | null;
  board: IHardwareBoard;
  connect: (explicitPort?: ISerialPort) => Promise<void>;
  disconnect: () => Promise<void>;
}

const SerialContext = createContext<SerialContextType | null>(null);

export function SerialProvider({ children }: { children: ReactNode }) {
  const [serialService] = useState<SerialService>(() => getSerialService());
  const [isConnected, setIsConnected] = useState(() => serialService.isConnected());
  const [status, setStatus] = useState<SerialStatus>(() => serialService.getStatus());
  const [serialPort, setSerialPort] = useState<ISerialPort | null>(() => serialService.getPort());

  useEffect(() => {
    // Subscribe to serial service status changes
    const handleStatusChange = (newStatus: SerialStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === SerialStatus.CONNECTED);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setStatus(SerialStatus.DISCONNECTED);
    };

    serialService.on('statusChange', handleStatusChange);
    serialService.on('disconnect', handleDisconnect);

    return () => {
      serialService.off('statusChange', handleStatusChange);
      serialService.off('disconnect', handleDisconnect);
    };
  }, [serialService]);

  const connect = useCallback(
    async (explicitPort?: ISerialPort) => {
      try {
        await serialService.connect(explicitPort);
        setSerialPort(serialService.getPort());
      } catch (error) {
        console.error('[SerialContext] Connection error:', error);
        throw error;
      }
    },
    [serialService],
  );

  const disconnect = useCallback(async () => {
    try {
      await serialService.disconnect();
      setSerialPort(null);
    } catch (error) {
      console.error('[SerialContext] Disconnection error:', error);
      throw error;
    }
  }, [serialService]);

  const value: SerialContextType = useMemo(
    () => ({
      isConnected,
      status,
      serialPort,
      board: serialService.getBoard(),
      connect,
      disconnect,
    }),
    [isConnected, status, serialPort, serialService, connect, disconnect],
  );

  return <SerialContext.Provider value={value}>{children}</SerialContext.Provider>;
}

export function useSerial(): SerialContextType {
  const context = useContext(SerialContext);
  if (!context) {
    throw new Error('useSerial must be used within a SerialProvider');
  }
  return context;
}
