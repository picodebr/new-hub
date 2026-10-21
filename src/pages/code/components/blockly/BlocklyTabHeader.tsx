/**
 * BlocklyTabHeader - Controle de navegação SCRATCH-style.
 *
 * Alterna entre abas de Código, Fantasias/Cenários e Sons.
 * Utiliza o StageContext para decidir se exibe "Fantasias" (Atores)
 * ou "Cenários" (Palco).
 */
import React from 'react';

interface BlocklyTabHeaderProps {
  activeTab: 'code' | 'costumes' | 'sounds';
  onTabChange: (tab: 'code' | 'costumes' | 'sounds') => void;
  isStage?: boolean;
}

export const BlocklyTabHeader: React.FC<BlocklyTabHeaderProps> = ({ activeTab, onTabChange, isStage }) => {
  return (
    <div
      className="d-flex flex-row align-items-end"
      style={{
        backgroundColor: '#e9eef2',
        minHeight: '52px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
      }}
    >
      <div
        onClick={() => onTabChange('code')}
        className={`d-flex align-items-center justify-content-center px-4 ${activeTab === 'code' ? 'bg-[#fafafa]' : 'text-secondary'}`}
        style={{
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          color: activeTab === 'code' ? '#4483ff' : '#999',
          cursor: 'pointer',
          borderTop: activeTab === 'code' ? '1px solid #ccc' : 'none',
          borderLeft: activeTab === 'code' ? '1px solid #ccc' : 'none',
          borderRight: activeTab === 'code' ? '1px solid #ccc' : 'none',
          zIndex: 1,
          position: 'relative',
          paddingTop: '8px',
          paddingBottom: activeTab === 'code' ? '12px' : '8px',
          marginBottom: '-4px',
          backgroundColor: activeTab === 'code' ? '#fff' : 'transparent',
          opacity: activeTab === 'code' ? 1 : 0.6,
        }}
      >
        <i className="bi bi-stack me-2" style={{ fontSize: '1rem' }}></i>
        <span className={activeTab === 'code' ? 'fw-bold fs-6' : 'fs-6'}>Código</span>
      </div>
      <div
        onClick={() => onTabChange('costumes')}
        className={`d-flex align-items-center justify-content-center px-4 ${activeTab === 'costumes' ? 'bg-[#fafafa]' : 'text-secondary'}`}
        style={{
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          color: activeTab === 'costumes' ? '#4483ff' : '#999',
          cursor: 'pointer',
          borderTop: activeTab === 'costumes' ? '1px solid #ccc' : 'none',
          borderLeft: activeTab === 'costumes' ? '1px solid #ccc' : 'none',
          borderRight: activeTab === 'costumes' ? '1px solid #ccc' : 'none',
          zIndex: 1,
          position: 'relative',
          paddingTop: '8px',
          paddingBottom: activeTab === 'costumes' ? '12px' : '8px',
          marginBottom: '-4px',
          backgroundColor: activeTab === 'costumes' ? '#fff' : 'transparent',
          opacity: activeTab === 'costumes' ? 1 : 0.6,
        }}
      >
        <i className={`bi ${isStage ? 'bi-image' : 'bi-brush-fill'} me-2`} style={{ fontSize: '1rem' }}></i>
        <span className={activeTab === 'costumes' ? 'fw-bold fs-6' : 'fs-6'}>{isStage ? 'Cenários' : 'Fantasias'}</span>
      </div>
      <div
        onClick={() => onTabChange('sounds')}
        className={`d-flex align-items-center justify-content-center px-4 ${activeTab === 'sounds' ? 'bg-[#fafafa]' : 'text-secondary'}`}
        style={{
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          color: activeTab === 'sounds' ? '#4483ff' : '#999',
          cursor: 'pointer',
          borderTop: activeTab === 'sounds' ? '1px solid #ccc' : 'none',
          borderLeft: activeTab === 'sounds' ? '1px solid #ccc' : 'none',
          borderRight: activeTab === 'sounds' ? '1px solid #ccc' : 'none',
          zIndex: 1,
          position: 'relative',
          paddingTop: '8px',
          paddingBottom: activeTab === 'sounds' ? '12px' : '8px',
          marginBottom: '-4px',
          backgroundColor: activeTab === 'sounds' ? '#fff' : 'transparent',
          opacity: activeTab === 'sounds' ? 1 : 0.6,
        }}
      >
        <i className="bi bi-volume-up-fill me-2" style={{ fontSize: '1rem' }}></i>
        <span className={activeTab === 'sounds' ? 'fw-bold fs-6' : 'fs-6'}>Sons</span>
      </div>
    </div>
  );
};
