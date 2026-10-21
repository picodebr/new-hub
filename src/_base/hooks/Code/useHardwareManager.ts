/**
 * useHardwareManager - Gestor de estado e monitoramento da conexão física.
 *
 * Responsabilidade: Encapsular a lógica de detecção de status serial, gestão de
 * erros de hardware e proteção de estado durante operações críticas (como upload).
 * Garante que a UI reflita fielmente o estado do link USB com a placa e previne
 * quebras de fluxo por desconexões acidentais.
 */
/**
 * Interface de alto nível para gerenciar a interação com a placa via Firmata.
 */
import { useUI } from '@/_base/context/UIContext';
import { ISerialPort, SerialStatus } from '@/_base/domain/entities';
import { getSerialService } from '@/_base/services/code';
import { useState, useEffect, useCallback, useMemo } from 'react';

export function useHardwareManager(isBusy: boolean) {
  const serialService = getSerialService();
  const board = serialService.getBoard(); // Expõe a placa singleton
  const { setShowDeviceLostWarning } = useUI();

  const [serialPort, setSerialPort] = useState<ISerialPort | null>(serialService.getPort());
  const [isSerialConnected, setIsSerialConnected] = useState(serialService.getStatus() === SerialStatus.CONNECTED);

  useEffect(() => {
    const handleStatusChange = (newStatus: SerialStatus) => {
      // PROTEÇÃO DE ESTADO DURANTE UPLOAD (ANTI-GLITCH):
      // Durante o upload via AvrGirl, a porta USB do Arduino sofre um Reset
      // (fecha e abre). Se monitorarmos a desconexão nesse exato momento,
      // a UI mostraria "Desconectado" por um milissegundo, o que causaria
      // o fechamento precoce do modal de progresso. A flag 'isBusy' serve
      // como um 'mute' temporário para o monitor de conexão serial.
      if (isBusy && newStatus === SerialStatus.DISCONNECTED) {
        return;
      }

      setIsSerialConnected((prev) => {
        const next = newStatus === SerialStatus.CONNECTED;
        return prev === next ? prev : next;
      });
      setSerialPort((prev) => {
        const current = serialService.getPort();
        return prev === current ? prev : current;
      });
    };

    const handleDisconnect = () => {
      if (isBusy) return;
      setIsSerialConnected((prev) => (prev === false ? prev : false));
      setSerialPort((prev) => (prev === null ? prev : null));
    };

    const handleError = (err: unknown) => {
      console.log('[useHardwareManager] Erro serial detectado:', err);
      if (isBusy) return;

      const error = err as any;
      const msg = error.message || '';
      const name = error.name || '';

      if (msg.includes('The device has been lost') || msg.includes('dispositivo foi perdido') || name === 'NetworkError') {
        console.warn('[useHardwareManager] Gatilho de Modal de Conexão Perdida ativado.');
        setShowDeviceLostWarning(true);
      }
    };

    serialService.on('statusChange', handleStatusChange);
    serialService.on('disconnect', handleDisconnect);
    serialService.on('error', handleError);

    return () => {
      serialService.off('statusChange', handleStatusChange);
      serialService.off('disconnect', handleDisconnect);
      serialService.off('error', handleError);
    };
  }, [isBusy, serialService]);

  const connectSerial = useCallback(
    async (explicitPort?: ISerialPort) => {
      await serialService.connect(explicitPort);
    },
    [serialService],
  );

  const disconnectSerial = useCallback(async () => {
    await serialService.disconnect();
  }, [serialService]);

  return useMemo(
    () => ({
      serialPort,
      isSerialConnected,
      board,
      connectSerial,
      disconnectSerial,
    }),
    [serialPort, isSerialConnected, board, connectSerial, disconnectSerial],
  );
}
