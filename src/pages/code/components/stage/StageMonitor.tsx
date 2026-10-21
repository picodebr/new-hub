'use client';

import { useProject } from '@/_base/context/ProjectContext';
import { MonitorData } from '@/_base/domain/entities';
import React, { useState, useEffect, useRef } from 'react';

export interface StageMonitorProps {
  monitor: MonitorData;
  scale: number;
}

export const StageMonitor: React.FC<StageMonitorProps> = ({ monitor, scale }) => {
  /* Hooks movidos para o topo para evitar erro de 'Rendered fewer hooks than expected' */
  const { updateMonitorPosition } = useProject();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, monitorX: 0, monitorY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      monitorX: monitor.x,
      monitorY: monitor.y,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStartPos.current.x) / scale;
      const dy = (e.clientY - dragStartPos.current.y) / scale;

      let newX = dragStartPos.current.monitorX + dx;
      let newY = dragStartPos.current.monitorY + dy;

      newX = Math.max(0, Math.min(newX, 480 - 40));
      newY = Math.max(0, Math.min(newY, 360 - 25));

      updateMonitorPosition(monitor.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, monitor.id, scale, updateMonitorPosition]);

  if (!monitor.visible) return null;

  // Estilos baseados no design do Scratch 3.0 / PiCode premium (Estilo Cápsula)
  return (
    <div
      id={`monitor-${monitor.id}`}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: `${monitor.x}px`,
        top: `${monitor.y}px`,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '5px',
        padding: '4px 6px 4px 12px',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#575E75',
        pointerEvents: 'auto',
        userSelect: 'none',
        boxShadow: isDragging ? '0 6px 16px rgba(0,0,0,0.12)' : '0 2px 5px rgba(0,0,0,0.06)',
        zIndex: isDragging ? 1000 : 200,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.04)' : 'scale(1)',
        transition: isDragging ? 'none' : 'box-shadow 0.2s, transform 0.2s, background-color 0.2s',
      }}
    >
      <span
        style={{
          marginRight: '8px',
          whiteSpace: 'nowrap',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'none',
          color: '#4d4d4d',
        }}
      >
        {monitor.label}
      </span>

      <div
        style={{
          backgroundColor: monitor.color || '#4C97FF',
          color: 'white',
          padding: '3px 12px',
          borderRadius: '20px',
          minWidth: '45px',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: '800',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
          textShadow: '0 1px 1px rgba(0,0,0,0.15)',
          letterSpacing: '0.3px',
        }}
      >
        {monitor.value}
      </div>
    </div>
  );
};
