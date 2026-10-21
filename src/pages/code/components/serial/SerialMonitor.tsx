/**
 * Componente SerialMonitor - Terminal para comunicação serial.
 *
 * Permite que o usuário visualize em tempo real as mensagens enviadas pela placa USB
 * (via Serial.print do Arduino).
 */

/**
 * Monitor Serial para depuração e visualização de logs em tempo real do hardware.
 */
'use client';

import { useFirmware } from '@/_base/context/FirmwareContext';
import { useUI } from '@/_base/context/UIContext';
import { DEFAULT_SERIAL_CONFIG } from '@/_base/domain/entities';
import { useEffect, useRef, useState } from 'react';

interface SerialMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void; // Função para voltar ao menu anterior de ferramentas
}

export default function SerialMonitor({ isOpen, onClose, onBack }: SerialMonitorProps) {
  // Firmware Context
  const { isSerialConnected, connectSerial, board, serialPort } = useFirmware();
  // UI Context
  const { setIsBusy } = useUI();

  // Estados locais para controlar a saída do texto e o comportamento da UI
  const [output, setOutput] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [baudRate, setBaudRate] = useState(9600);

  // Referências para o leitor serial e para o controle de rolagem
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const keepReadingRef = useRef(false);

  // O Monitor Serial inicia em 9600 (padrão Arduino), que agora coincide com o
  // DEFAULT_SERIAL_CONFIG (9600) do Firmata.

  /**
   * Altera o Baud Rate
   */
  const handleBaudRateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRate = Number(e.target.value);
    setBaudRate(newRate);

    if (board) {
      if (typeof (board as unknown as { setBaudRate: (rate: number) => Promise<void> }).setBaudRate === 'function') {
        try {
          await (board as unknown as { setBaudRate: (rate: number) => Promise<void> }).setBaudRate(newRate);
        } catch (err) {
          console.error('Falha ao mudar Baud Rate:', err);
        }
      }
    }
  };

  // Efeito para Rolagem Automática (Auto-scroll)
  useEffect(() => {
    if (isAutoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isAutoScroll]);

  // Efeito para Gestão de Abertura/Fechamento do Monitor
  useEffect(() => {
    // Se o monitor for fechado, sinaliza para parar a leitura e limpa o leitor
    if (!isOpen) {
      keepReadingRef.current = false;
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {});
        readerRef.current = null;
      }

      // Reverte o baud rate para o padrão do Firmata para não quebrar os blocos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const boardEx = board as any;
      if (boardEx && typeof boardEx.getBaudRate === 'function') {
        if (boardEx.getBaudRate() !== DEFAULT_SERIAL_CONFIG.baudRate) {
          try {
            const res = boardEx.setBaudRate(DEFAULT_SERIAL_CONFIG.baudRate);
            if (res && typeof res.catch === 'function') res.catch(() => {});
          } catch {
            // Falha ao resetar baud rate, mas não é crítico. Apenas loga o erro.
          }
        }
      }
      return;
    }
  }, [isOpen, board]);

  // Efeito para o Loop de Leitura Serial (Lê os bytes da Web Serial API)
  useEffect(() => {
    // Só lê se o monitor estiver aberto, a porta conectada e o usuário clicou em "Conectar" no monitor
    if (!isOpen || !isSerialConnected || !isMonitoring) return;

    // Função de tratamento de dados vindo do StageBoard (Spy Mode)
    const handleData = (data: Uint8Array) => {
      if (keepReadingRef.current) {
        const text = new TextDecoder().decode(data);
        setOutput((prev) => (prev + text).slice(-5000));
      }
    };

    keepReadingRef.current = true;

    if (board) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (board as any).setExternalDataListener(handleData);
      } catch {
        console.error('Erro ao configurar listener do Monitor Serial:');
      }
    }

    return () => {
      keepReadingRef.current = false;
      if (board) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (board as any).setExternalDataListener(null);
        } catch {
          console.error('Erro ao remover listener do Monitor Serial:');
        }
      }
    };
  }, [isOpen, isSerialConnected, isMonitoring, board]);

  // Efeito para limpar o monitor ao abrir
  useEffect(() => {
    if (isOpen) {
      setOutput(''); // Inicia sessão limpa
      setIsMonitoring(false); // Aguarda o clique em "Conectar"
    } else {
      setIsMonitoring(false);
      setIsBusy(false);
    }
  }, [isOpen, setIsBusy]);

  /**
   * Envia os dados digitados na serial
   */
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Garante que temos input e uma placa conectada
    if (!inputValue || !board || !isSerialConnected) return;

    try {
      const payload = inputValue + '\n';

      // Re-use board's existing stream writer (it suppresses "locked" errors)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const boardEx = board as any;
      if (typeof boardEx.writeString === 'function') {
        await boardEx.writeString(payload);
      } else if (serialPort?.writable && !serialPort.writable.locked) {
        // Fallback for boards that don't implement writeString natively
        const writer = serialPort.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(payload));
        writer.releaseLock();
      }

      // Opcional: mostrar no terminal local o que foi enviado
      setOutput((prev) => (prev + `> ${inputValue}\n`).slice(-5000));
      setInputValue('');
    } catch (err) {
      console.error('Erro ao enviar:', err);
      setOutput((prev) => (prev + `\n[Erro ao enviar: ${String(err)}]\n`).slice(-5000));
    }
  };

  if (!isOpen) return null;

  const borderColor = '#0d6efd';

  return (
    <div
      className="modal fade show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 2000 }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ border: `3px solid ${borderColor}` }}>
          {/* CABEÇALHO DO MONITOR */}
          <div className="modal-header border-0 bg-white pb-2 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40, backgroundColor: '#cfe2ff', color: borderColor }}
              >
                <i className="bi bi-terminal-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark lh-1">Monitor Serial</h5>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Comunicação direta com a placa
                </small>
              </div>
            </div>

            {/* Controles de Baud Rate e Fechar */}
            <div className="ms-sm-auto d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm border-secondary text-secondary "
                style={{ width: '130px', borderRadius: '10px' }}
                value={baudRate}
                onChange={handleBaudRateChange}
              >
                <option value="9600">9600 baud</option>
                <option value="57600">57600 baud</option>
                <option value="115200">115200 baud</option>
              </select>

              <button type="button" className="btn p-0 border-0 ms-2" onClick={onBack || onClose}>
                <i className="bi bi-x-lg text-dark"></i>
              </button>
            </div>
          </div>

          {/* CORPO DO MONITOR (TERMINAL + INPUT) */}
          <div className="modal-body bg-white p-3 d-flex flex-column" style={{ minHeight: '300px' }}>
            <div
              className="bg-black rounded-3 p-2 shadow-inner flex-grow-1 d-flex flex-column"
              style={{ minHeight: '250px', maxHeight: '50vh', border: '1px solid #444', position: 'relative' }}
            >
              <textarea
                ref={outputRef}
                className="form-control bg-black text-success font-monospace border-0 flex-grow-1 w-100 p-0"
                style={{ resize: 'none', boxShadow: 'none', fontSize: '0.9rem', outline: 'none' }}
                readOnly
                value={output}
                placeholder="// Aguardando dados..."
              ></textarea>
            </div>

            {/* Entrada de dados Serial */}
            <form onSubmit={handleSend} className="d-flex flex-column flex-sm-row gap-2 mt-3">
              <input
                type="text"
                className="form-control bg-light"
                placeholder="Mensagem..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={!isMonitoring || !isSerialConnected}
              />
              <button
                type="submit"
                className="btn btn-primary px-4 d-flex align-items-center justify-content-center gap-2"
                disabled={!isMonitoring || !isSerialConnected || !inputValue}
                title="Enviar (Enter)"
              >
                <i className="bi bi-send-fill"></i> <span>Enviar</span>
              </button>
            </form>
          </div>

          {/* RODAPÉ E CONTROLES DE CONEXÃO */}
          <div className="modal-footer border-0 bg-white d-flex justify-content-between py-3">
            <div className="form-check form-check-inline small m-0 ms-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="checkAutoscroll"
                checked={isAutoScroll}
                onChange={(e) => setIsAutoScroll(e.target.checked)}
              />
              <label className="form-check-label fw-bold text-secondary" htmlFor="checkAutoscroll">
                Rolagem Automática
              </label>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary px-3 rounded-pill" onClick={() => setOutput('')}>
                <i className="bi bi-eraser me-1"></i> Limpar
              </button>

              {/* Lógica de Alternância Conectar/Desconectar */}
              {!isMonitoring || !isSerialConnected ? (
                <button
                  className="btn btn-sm btn-primary px-4 rounded-pill fw-bold shadow-sm"
                  onClick={async () => {
                    if (!isSerialConnected) {
                      await connectSerial();
                    }
                    setIsMonitoring(true);
                    // Se estiver desconectado e for conectar pelo monitor, força o baud actual da selecao
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const boardEx = board as any;
                    if (boardEx && typeof boardEx.setBaudRate === 'function') {
                      setTimeout(() => {
                        try {
                          const res = boardEx.setBaudRate(baudRate);
                          if (res && typeof res.catch === 'function') {
                            res.catch((e: Error) => console.error(e));
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }, 200);
                    }
                  }}
                >
                  <i className="bi bi-plug-fill me-1"></i> Conectar
                </button>
              ) : (
                <button className="btn btn-sm btn-danger px-4 rounded-pill fw-bold" onClick={() => setIsMonitoring(false)}>
                  <i className="bi bi-x-circle me-1"></i> Desconectar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
