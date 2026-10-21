import React, { useState } from 'react';

export interface ScratchAddMenuItem {
  icon: string;
  title: string;
  onClick: () => void;
}

interface ScratchAddButtonProps {
  mainLabel: string;
  mainTitle: string;
  mainIcon: string;
  onMainClick: () => void;
  items: ScratchAddMenuItem[];
  alignLabel?: 'left' | 'right';
  center?: boolean;
}

export function ScratchAddButton({
  mainLabel,
  mainTitle,
  mainIcon,
  onMainClick,
  items,
  alignLabel = 'left',
  center = false,
}: ScratchAddButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        ...(center ? { right: '50%', transform: `translateX(50%)`, bottom: '15px' } : { right: '15px', bottom: '15px' }),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1000,
        transformOrigin: 'bottom right',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rótulo Principal (aparece à esquerda do botão ao passar o mouse) */}
      <div
        style={{
          position: 'absolute',
          ...(alignLabel === 'left' ? { right: '50px' } : { left: '50px' }),
          bottom: '6px',
          background: '#4C97FF',
          color: 'white',
          padding: '5px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 10,
        }}
      >
        {mainLabel}
      </div>

      {/* Menu Vertical (ícones flutuantes escondidos) */}
      <div
        className="scratch-add-button-menu"
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '5px 0 15px 0',
          backgroundColor: '#5591f2',
          borderRadius: '20px 20px 0 0',
          zIndex: -1,
          opacity: isHovered ? 1 : 0,
          visibility: isHovered ? 'visible' : 'hidden',
          transition: isHovered
            ? 'opacity 0.3s ease, visibility 0.3s ease'
            : 'opacity 0.3s ease 0.3s, visibility 0.3s ease 0.3s',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        }}
      >
        {items.map((item, index) => (
          <button
            key={index}
            title={item.title}
            onClick={item.onClick}
            className="scratch-add-button-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, transform 0.2s ease, width 0.2s ease, height 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <i className={`bi ${item.icon}`}></i>
          </button>
        ))}
      </div>

      {/* Botão Redondo Principal */}
      <button
        title={mainTitle}
        onClick={onMainClick}
        className="scratch-add-button-main"
        style={{
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          backgroundColor: '#4C97FF',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 200,
          color: 'white',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, background-color 0.2s ease, width 0.2s ease, height 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.backgroundColor = '#3373cc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = '#4C97FF';
        }}
      >
        <i className={`bi ${mainIcon}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }}></i>
      </button>
    </div>
  );
}
