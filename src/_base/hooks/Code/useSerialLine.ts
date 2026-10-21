/**
 * useSerialLine - Leitor de Dados Seriais Linha por Linha (Modo Espião).
 *
 * Agora utiliza o `StageBoard` para "escutar" os dados trafegando na conexão ativa,
 * sem desconectar ou roubar a porta exclusiva.
 */
/**
 * Utilitário para processamento de buffer serial linha-a-linha.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFirmware } from '../../context/FirmwareContext';

export function useSerialLine(baudRate: number = 9600) {
  const { board, isSerialConnected } = useFirmware();
  const [lastLine, setLastLine] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  // Buffer para acumular fragmentos de texto decodificados
  const bufferRef = useRef<string>('');

  const disconnect = useCallback(async () => {
    if (board) {
      try {
        board.setExternalDataListener(null);
        // Reverte para o baud rate padrão (Firmata) para não quebrar os blocos
        if (typeof board.setBaudRate === 'function') {
          await board.setBaudRate(9600);
        }
      } catch (e) {
        console.warn('Erro ao remover listener:', e);
      }
    }
    setIsConnected(false);
    bufferRef.current = '';
  }, [board]);

  const connect = useCallback(async () => {
    if (!board || !isSerialConnected) {
      console.warn('Tentativa de conectar monitor sem placa conectada.');
      return;
    }

    try {
      // Aplica o baud rate específico do monitor (ex: 9600 para sensores simples)
      if (typeof board.setBaudRate === 'function') {
        await board.setBaudRate(baudRate);
      }

      // Função de callback que recebe os dados brutos do StageBoard
      const handleData = (data: Uint8Array) => {
        const text = new TextDecoder().decode(data);
        bufferRef.current += text;

        // Processa linhas completas
        if (bufferRef.current.includes('\n')) {
          const lines = bufferRef.current.split('\n');
          // A última parte pode ser incompleta, guardamos ela de volta no buffer
          bufferRef.current = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              setLastLine(trimmed);
            }
          }
        }
      };

      // Registra o "espião"
      board.setExternalDataListener(handleData);
      setIsConnected(true);
    } catch (e) {
      console.error('Erro ao configurar listener do monitor:', e);
      setIsConnected(false);
    }
  }, [board, isSerialConnected, baudRate]);

  // Cleanup automático ao desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { lastLine, isConnected, connect, disconnect };
}
