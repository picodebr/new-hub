/**
 * Componente HumidityModal - Monitor de Umidade em Tempo Real.
 *
 * Este modal conecta-se à porta serial para ler valores de um sensor de umidade
 * (entrada analógica 0-1023) e exibe uma animação de "tanque de água" que enche
 * ou esvazia conforme o nível detectado.
 */

'use client';

import { useSerialLine } from '@/_base/hooks/Code/useSerialLine';
import { useEffect, useMemo } from 'react';

interface HumidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

export default function HumidityModal({ isOpen, onClose, onBack }: HumidityModalProps) {
  // Hook customizado para ler uma linha da porta serial (baudRate 9600)
  const { lastLine, isConnected, connect, disconnect } = useSerialLine(9600);
  // Converte o valor analógico recebido em número puro (memoizado)
  const value = useMemo(() => {
    if (!lastLine) return 0;
    const parsed = parseInt(lastLine, 10);
    return isNaN(parsed) ? 4 : Math.max(4, Math.min(980, parsed));
  }, [lastLine]);

  // Cleanup
  useEffect(() => {
    if (!isOpen && isConnected) disconnect();
  }, [isOpen, isConnected, disconnect]);

  const percent = Math.round(((980 - value) / (980 - 4)) * 100);
  const waveTop = 100 - percent * 1.1;
  const borderColor = '#0dcaf0'; // Cyan/Info

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden', border: `3px solid ${borderColor}` }}>
          {/* CABEÇALHO (Unificado com Serial/IA) */}
          <div className="modal-header border-0 bg-white pb-2 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40, backgroundColor: '#cff4fc', color: borderColor }}
              >
                <i className="bi bi-droplet-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark lh-1">Monitor de Umidade</h5>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Nível de água e umidade do solo
                </small>
              </div>
            </div>

            <div className="ms-auto d-flex align-items-center gap-2">
              <button
                className="btn btn-sm px-2 py-1"
                onClick={() => {
                  disconnect();
                  onBack();
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div
            className="modal-body text-center py-4 py-sm-5 d-flex flex-column align-items-center justify-content-center overflow-auto"
            style={{ maxHeight: '70vh' }}
          >
            {/* WATER TANK */}
            <div
              className="water-tank-container mx-auto mb-4 position-relative"
              style={{
                width: 'min(220px, 55vw)',
                height: 'min(220px, 55vw)',
                background: '#f8f9fa',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '6px solid #fff',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05), 0 10px 20px rgba(13, 202, 240, 0.2)',
              }}
            >
              {/* The Wave */}
              <div
                style={{
                  position: 'absolute',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(to top, #0d6efd, #0dcaf0)',
                  borderRadius: '38%',
                  opacity: 0.9,
                  top: `${waveTop}%`,
                  transition: 'top 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: 'spin-wave 5s infinite linear',
                }}
              />

              {/* Value Text Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  fontSize: 'min(3.5rem, 12vw)',
                  fontWeight: 'bold',
                  color: percent > 50 ? 'white' : '#495057',
                  textShadow: percent > 50 ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  transition: 'color 0.3s',
                }}
              >
                {percent}
                <small style={{ fontSize: '0.6em' }}>%</small>
              </div>
            </div>

            {/* RAW VALUE */}
            <div className="text-muted small fw-bold bg-light d-inline-block px-3 py-1 rounded-pill">Entrada Analógica: {value}</div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer border-0 bg-white justify-content-center py-3">
            <div>
              {!isConnected ? (
                <button
                  className="btn rounded-pill px-5 fw-bold shadow-sm text-white"
                  onClick={connect}
                  style={{
                    background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)',
                    border: 'none',
                    fontSize: '1.1rem',
                  }}
                >
                  <i className="bi bi-play-circle-fill me-2"></i>
                  Iniciar
                </button>
              ) : (
                <button className="btn btn-outline-danger px-5 rounded-pill fw-bold" onClick={disconnect}>
                  Parar
                </button>
              )}
            </div>
          </div>

          <style jsx>{`
            @keyframes spin-wave {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
