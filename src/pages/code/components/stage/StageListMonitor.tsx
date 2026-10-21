'use client';

import { useProject } from '@/_base/context/ProjectContext';
import { MonitorData } from '@/_base/domain/entities';
import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface StageListMonitorProps {
  monitor: MonitorData;
  scale: number;
}

const MIN_WIDTH = 80;
const MIN_HEIGHT = 100;
const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 200;

/**
 * StageListMonitor - Monitor de lista exibido no palco, no estilo Scratch 3.0.
 *
 * Suporta:
 *  - Drag para reposicionar (header)
 *  - Resize pela alça do canto inferior-direito
 *  - Scroll nos itens
 *  - Contador de comprimento no rodapé
 */
export const StageListMonitor: React.FC<StageListMonitorProps> = ({ monitor, scale }) => {
  const { updateMonitorPosition } = useProject();

  // Estado local de tamanho (não salvo no backend por ora, apenas reativo)
  const [size, setSize] = useState({
    width: monitor.width ?? DEFAULT_WIDTH,
    height: monitor.height ?? DEFAULT_HEIGHT,
  });

  // Drag para mover
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, monitorX: 0, monitorY: 0 });

  // Resize pela alça
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT });

  const items = monitor.items ?? [];

  // ── Drag ──────────────────────────────────────────────────
  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        monitorX: monitor.x,
        monitorY: monitor.y,
      };
      e.preventDefault();
      e.stopPropagation();
    },
    [monitor.x, monitor.y],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStartPos.current.x) / scale;
      const dy = (e.clientY - dragStartPos.current.y) / scale;
      const newX = Math.max(0, Math.min(dragStartPos.current.monitorX + dx, 480 - size.width));
      const newY = Math.max(0, Math.min(dragStartPos.current.monitorY + dy, 360 - size.height));
      updateMonitorPosition(monitor.id, newX, newY);
    };
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, monitor.id, scale, size, updateMonitorPosition]);

  // ── Resize ─────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true);
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: size.width,
        h: size.height,
      };
      e.preventDefault();
      e.stopPropagation();
    },
    [size],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizeStart.current.x) / scale;
      const dy = (e.clientY - resizeStart.current.y) / scale;
      setSize({
        width: Math.max(MIN_WIDTH, resizeStart.current.w + dx),
        height: Math.max(MIN_HEIGHT, resizeStart.current.h + dy),
      });
    };
    const handleMouseUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, scale]);

  if (!monitor.visible) return null;

  const headerColor = monitor.color || '#FF8C1A';
  const cursor = isDragging ? 'grabbing' : 'grab';

  return (
    <div
      id={`list-monitor-${monitor.id}`}
      style={{
        position: 'absolute',
        left: `${monitor.x}px`,
        top: `${monitor.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.14)',
        zIndex: isDragging || isResizing ? 1000 : 200,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.15s, transform 0.15s',
        userSelect: 'none',
        pointerEvents: 'auto',
        border: '1px solid rgba(0,0,0,0.10)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        onMouseDown={handleHeaderMouseDown}
        style={{
          backgroundColor: headerColor,
          color: 'white',
          fontSize: '11px',
          fontWeight: '700',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '4px 8px',
          cursor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          letterSpacing: '0.2px',
          minHeight: '24px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={monitor.label}
      >
        {monitor.label}
      </div>

      {/* ── Body (scrollable items) ─────────────────────────── */}
      <div
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.97)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              padding: '8px 6px',
              fontSize: '10px',
              color: '#aaa',
              textAlign: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            (vazia)
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                minHeight: '22px',
              }}
            >
              {/* Index badge */}
              <div
                style={{
                  width: '22px',
                  flexShrink: 0,
                  textAlign: 'center',
                  fontSize: '9px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: headerColor,
                  alignSelf: 'stretch',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {index + 1}
              </div>
              {/* Item value */}
              <div
                style={{
                  flex: 1,
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#333333',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={String(item)}
              >
                {String(item)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Footer (length + resize handle) ─────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(240,240,240,0.98)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          padding: '2px 4px 2px 6px',
          flexShrink: 0,
          minHeight: '20px',
        }}
      >
        {/* Length label */}
        <span
          style={{
            fontSize: '9px',
            fontWeight: '700',
            color: '#888',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.3px',
          }}
        >
          comprimento: {items.length}
        </span>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            width: '12px',
            height: '12px',
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5,
            flexShrink: 0,
          }}
          title="Redimensionar"
        >
          {/* Small triangle icon (CSS-only) */}
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M8 0L8 8L0 8Z" fill="#888" />
          </svg>
        </div>
      </div>
    </div>
  );
};
