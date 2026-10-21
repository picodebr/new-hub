/**
 * Componente LuminosityModal - Monitor de Luminosidade em Tempo Real.
 *
 * Este modal exibe o nível de luz captado por um sensor (LDR), transformando o
 * valor analógico (0-1023) em uma interface dinâmica:
 * 1. O fundo da tela escurece ou clareia conforme a luz ambiente.
 * 2. O ícone do sol brilha e pulsa baseando-se na intensidade luminosa.
 */

'use client';

import { useSerialLine } from '@/_base/hooks/Code/useSerialLine';
import { useEffect, useMemo } from 'react';

interface LuminosityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void; // Para retornar ao menu de ferramentas
}

export default function LuminosityModal({ isOpen, onClose, onBack }: LuminosityModalProps) {
  // Hook de conexão serial simplificada
  const { lastLine, isConnected, connect, disconnect } = useSerialLine(9600);
  // Converte o valor analógico recebido em número puro (memoizado)
  const value = useMemo(() => {
    if (!lastLine) return 0;
    const parsed = parseInt(lastLine, 10);
    return isNaN(parsed) ? 0 : Math.max(0, Math.min(1023, parsed));
  }, [lastLine]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && isConnected) {
      disconnect();
    }
  }, [isOpen, isConnected, disconnect]);

  // Visual calculations
  const brightnessPercent = (value / 1023) * 100;

  // Icon Opacity: 0.2 (Min) -> 1.0 (Max)
  const iconOpacity = 0.2 + (brightnessPercent / 100) * 0.8;

  // Background Color Interpolation (INNER CARD)
  // 0 -> rgb(20,20,20) (Not pure black to look good in card)
  // 1023 -> rgb(255,255,255)

  // To keep the text readable, we might invert colors or just add a text shadow.
  // Given the "Clean White Card" request, maybe we keep the CARD white,
  // and just change a visual indicators background?
  // User asked: "tela fique branca... preto"
  // Let's make the MODAL BODY background dynamic.

  const bgLevel = Math.round((value / 1023) * 235) + 20; // 20 to 255
  const bgColor = `rgb(${bgLevel}, ${bgLevel}, ${bgLevel})`;

  const textColor = bgLevel > 140 ? '#212529' : '#f8f9fa';
  const borderColor = '#ffc107'; // Warning/Yellow

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
        <div
          className="modal-content border-0 shadow-lg"
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: `3px solid ${borderColor}`,
          }}
        >
          {/* CABEÇALHO (Unificado com Serial/IA) */}
          <div className="modal-header border-0 bg-white pb-2 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40, backgroundColor: '#fff3cd', color: borderColor }}
              >
                <i className="bi bi-brightness-high-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark lh-1">Monitor de Luz</h5>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Intensidade luminosa ambiente
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

          {/* BODY (Dynamic BG) */}
          <div
            className="modal-body text-center py-4 py-sm-5 d-flex flex-column align-items-center justify-content-center overflow-hidden"
            style={{
              backgroundColor: bgColor,
              transition: 'background-color 0.1s ease',
              minHeight: '250px',
              height: '50vh',
              maxHeight: '70vh',
            }}
          >
            {/* SUN ICON */}
            <div
              className="mb-4 d-flex justify-content-center align-items-center position-relative"
              style={{ height: 'min(120px, 30vw)', width: 'min(120px, 30vw)' }}
            >
              {/* Halo / Glow */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,193,7,0.4) 0%, rgba(255,193,7,0) 70%)',
                  opacity: iconOpacity,
                  transform: `scale(${1 + value / 1023})`,
                  transition: 'all 0.1s ease',
                }}
              ></div>

              <i
                className="bi bi-sun-fill position-relative"
                style={{
                  fontSize: 'min(80px, 20vw)',
                  color: bgLevel > 200 ? '#ffc107' : '#ffda6a', // Slightly lighter on dark
                  opacity: 1, // Icon always visible
                  filter: `drop-shadow(0 0 ${value / 30}px rgba(255, 193, 7, 0.8))`,
                  transition: 'all 0.1s ease',
                  transform: `scale(${0.9 + value / 2048})`,
                }}
              ></i>
            </div>

            {/* VALUES */}
            <h1 className="display-3 fw-bold mb-0" style={{ color: textColor, transition: 'color 0.2s', fontSize: 'min(4.5rem, 15vw)' }}>
              {Math.round(brightnessPercent)}%
            </h1>
            <div
              className="mt-2 fw-bold bg-white bg-opacity-25 d-inline-block px-3 py-1 rounded-pill"
              style={{ color: textColor, fontSize: '0.8rem' }}
            >
              Valor Serial: {value}
            </div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer border-0 bg-white justify-content-center py-3">
            {!isConnected ? (
              <button
                className="btn rounded-pill px-5 fw-bold shadow-sm"
                onClick={connect}
                style={{
                  backgroundColor: '#ffc107',
                  color: '#000',
                  border: 'none',
                  fontSize: '1.1rem',
                }}
              >
                <i className="bi bi-play-circle-fill me-2"></i>
                Iniciar
              </button>
            ) : (
              <button className="btn btn-outline-danger rounded-pill px-5 fw-bold" onClick={disconnect}>
                Parar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
