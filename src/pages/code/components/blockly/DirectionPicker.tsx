/**
 * DirectionPicker - Seletor de Direção Visual (Scratch-style).
 *
 * Implementa um dial circular para ajuste de ângulo e seleção de estilo de
 * rotação (all-around, left-right, none).
 *
 * Regra Técnica: Mapeia o sistema de coordenadas trigonométricas do navegador
 * para o sistema do Scratch onde 0° é para cima, 90° para a direita e
 * limites entre -179° e 180°.
 */
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface DirectionPickerProps {
  angle: number;
  rotationStyle: 'all around' | 'left-right' | "don't rotate";
  onSelectAngle: (angle: number) => void;
  onSelectRotationStyle: (style: 'all around' | 'left-right' | "don't rotate") => void;
  onClose: () => void;
  targetElementRef?: React.RefObject<HTMLElement | null>;
}

export const DirectionPicker: React.FC<DirectionPickerProps> = ({
  angle,
  rotationStyle,
  onSelectAngle,
  onSelectRotationStyle,
  onClose,
  targetElementRef,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isInsideContainer = containerRef.current && containerRef.current.contains(event.target as Node);
      const isTargetElement = targetElementRef?.current && targetElementRef.current.contains(event.target as Node);

      if (!isInsideContainer && !isTargetElement) {
        onClose();
      }
    };
    // Aguarda o próximo tick para não capturar o clique que abriu o picker
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, targetElementRef]);

  const updateAngle = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      // atan2(dy, dx) nos dá o ângulo em radianos
      // Mapeamos para o sistema do Scratch (0 = cima, 90 = direita, 180 = baixo, -90 = esquerda)
      const rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI + 90;

      // Normaliza para -179 a 180
      if (deg > 180) deg -= 360;
      if (deg < -179) deg += 360;

      onSelectAngle(Math.round(deg));
    },
    [onSelectAngle],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateAngle(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateAngle(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateAngle]);

  // Posicionamento dinâmico
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    if (targetElementRef?.current) {
      const rect = targetElementRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 230, // Altura aproximada do modal + margem
        left: rect.left - 65, // Ajuste lateral para centralizar no input
      });
    }
  }, [targetElementRef]);

  // Estilo do gradiente conforme o ângulo (Scratch style)
  const getDialBackground = () => {
    // 0 graus é para cima (12 horas)
    // Se positivo: o caminho escuro vai de 0 até o ângulo (horário)
    // Se negativo: o caminho escuro vai do ângulo até 0 (horário de 270..360 etc)
    if (angle >= 0) {
      return `conic-gradient(from 0deg, #3373cc 0deg, #3373cc ${angle}deg, #4c97ff ${angle}deg)`;
    } else {
      const startPoint = 360 + angle;
      return `conic-gradient(from 0deg, #4c97ff 0deg, #4c97ff ${startPoint}deg, #3373cc ${startPoint}deg)`;
    }
  };

  // Renderiza via Portal no final do body
  return createPortal(
    <div
      ref={containerRef}
      className="direction-picker-popover shadow-lg"
      style={{
        top: coords.top,
        left: coords.left,
      }}
    >
      <div
        ref={dialRef}
        className="direction-dial"
        onMouseDown={handleMouseDown}
        style={{
          background: getDialBackground(),
          border: 'none', // Sobrescreve a borda padrão para ficar mais limpo
        }}
      >
        {/* Marcadores de hora */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="dial-marker"
            style={{
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
              backgroundColor: 'rgba(255,255,255,0.4)', // Marcadores claros sobre fundo azul
            }}
          />
        ))}

        {/* Setas e Visualização do Ângulo */}
        <div
          className="dial-hand-container"
          style={{
            transform: `translate(-50%, -50%) rotate(${angle - 90}deg)`,
          }}
        >
          <div className="dial-knob" style={{ backgroundColor: '#3373cc' }}>
            <i className="bi bi-arrow-right-short text-white" style={{ fontSize: '1.2rem' }}></i>
          </div>
          {/* Linha do ponteiro */}
          <div className="dial-line" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
        </div>

        {/* Centro */}
        <div className="dial-center-dot" style={{ backgroundColor: '#fff' }} />
      </div>

      {/* Seletor de Estilo de Rotação */}
      <div className="d-flex w-100 justify-content-between mt-3 px-1">
        {/* All Around */}
        <button
          className={`btn btn-sm flex-grow-1 mx-1 d-flex align-items-center justify-content-center ${rotationStyle === 'all around' ? 'btn-primary-subtle border-primary text-primary' : 'btn-outline-secondary border-0 opacity-50'}`}
          onClick={() => onSelectRotationStyle('all around')}
          title="Girar sempre"
          style={{ height: '32px' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
          </svg>
        </button>

        {/* Left-Right */}
        <button
          className={`btn btn-sm flex-grow-1 mx-1 d-flex align-items-center justify-content-center ${rotationStyle === 'left-right' ? 'btn-primary-subtle border-primary text-primary' : 'btn-outline-secondary border-0 opacity-50'}`}
          onClick={() => onSelectRotationStyle('left-right')}
          title="Esquerda/Direita"
          style={{ height: '32px' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="7 10 4 12 7 14" />
            <polyline points="17 10 20 12 17 14" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        </button>

        {/* Don't Rotate */}
        <button
          className={`btn btn-sm flex-grow-1 mx-1 d-flex align-items-center justify-content-center ${rotationStyle === "don't rotate" ? 'btn-primary-subtle border-primary text-primary' : 'btn-outline-secondary border-0 opacity-50'}`}
          onClick={() => onSelectRotationStyle("don't rotate")}
          title="Não girar"
          style={{ height: '32px' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </button>
      </div>

      {/* Seta do popover (baixo) */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '10px solid #fff',
        }}
      />
    </div>,
    document.body,
  );
};
