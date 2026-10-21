/**
 * Componente PercentageModal - Monitor Genérico em Porcentagem.
 *
 * Exibe qualquer valor analógico (0-1023) como uma porcentagem de 0% a 100%,
 * utilizando um gráfico circular (Radial Progress Bar) animado via SVG.
 */

'use client';

import { useSerialLine } from '@/_base/hooks/Code/useSerialLine';
import { useEffect, useMemo } from 'react';

interface PercentageModalProps {
  isOpen: boolean;
  onBack: () => void;
}

export default function PercentageModal({ isOpen, onBack }: PercentageModalProps) {
  const { lastLine, isConnected, connect, disconnect } = useSerialLine(9600);
  // Converte o valor analógico recebido em número puro (memoizado)
  const value = useMemo(() => {
    if (!lastLine) return 0;
    const parsed = parseInt(lastLine, 10);
    return isNaN(parsed) ? 0 : Math.max(0, Math.min(1023, parsed));
  }, [lastLine]);

  useEffect(() => {
    if (!isOpen && isConnected) disconnect();
  }, [isOpen, isConnected, disconnect]);

  const percent = Math.round((value / 1023) * 100);

  // SVG Circle Math
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Theme
  const borderColor = '#198754'; // Success/Green
  const lightBg = '#d1e7dd';

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ border: `3px solid ${borderColor}` }}>
          {/* HEADER */}
          <div className="modal-header border-0 bg-white pb-0">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40, backgroundColor: lightBg, color: borderColor }}
              >
                <i className="bi bi-pie-chart-fill fs-5"></i>
              </div>
              <h5 className="modal-title fw-bold text-dark">Monitor Porcentagem</h5>
            </div>
            <button
              type="button"
              className="btn p-0 border-0"
              onClick={() => {
                disconnect();
                onBack();
              }}
            >
              <i className="bi bi-x-lg text-dark"></i>
            </button>
          </div>

          <div
            className="modal-body text-center py-4 py-sm-5 d-flex flex-column align-items-center justify-content-center overflow-auto"
            style={{ maxHeight: '70vh' }}
          >
            {/* CIRCULAR PROGRESS */}
            <div className="position-relative mx-auto" style={{ width: 'min(240px, 60vw)', height: 'min(240px, 60vw)' }}>
              <svg width="100%" height="100%" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Circle */}
                <circle cx="80" cy="80" r={radius} fill="none" stroke="#f0f2f5" strokeWidth="14" />
                {/* Progress Shadow (Optional) */}

                {/* Progress Circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={borderColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    transition: 'stroke-dashoffset 0.4s cubic-bezier(0.35, 0, 0.25, 1)',
                    filter: 'drop-shadow(0 0 4px rgba(25, 135, 84, 0.3))',
                  }}
                />
              </svg>

              {/* Center Content */}
              <div className="position-absolute top-50 start-50 translate-middle text-center w-100">
                <span className="display-4 fw-bold d-block d-sm-inline" style={{ color: '#212529', fontSize: 'min(4rem, 15vw)' }}>
                  {percent}
                </span>
                <span className="fs-4 text-muted ms-1">%</span>
              </div>
            </div>

            <div className="text-muted small mt-4 fw-bold bg-light d-inline-block px-3 py-1 rounded-pill">Entrada Analógica: {value}</div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer border-0 bg-white justify-content-center py-3">
            {!isConnected ? (
              <button
                className="btn rounded-pill px-5 fw-bold shadow-sm text-white"
                onClick={connect}
                style={{
                  backgroundColor: borderColor,
                  border: 'none',
                  fontSize: '1.1rem',
                }}
              >
                <i className="bi bi-play-circle-fill me-2"></i>
                Monitorar
              </button>
            ) : (
              <button className="btn btn-outline-danger px-5 rounded-pill fw-bold" onClick={disconnect}>
                Parar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
