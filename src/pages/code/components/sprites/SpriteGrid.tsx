/**
 * Exibição visual dos atores em formato de grade para a biblioteca de seleção.
 */
'use client';
import React from 'react';
import Image from 'next/image';
import { SpriteData } from '@/_base/domain/entities';
import { ScratchAddButton } from '../shared/ScratchAddButton';

interface SpriteGridProps {
  sprites: SpriteData[];
  activeSpriteId: string;
  selectSprite: (id: string) => void;
  deleteSprite: (id: string) => void;
  // addSprite: (file?: File) => void;
  addSurpriseSprite: () => void;
  openSpriteGallery: () => void;
  openPaintEditor: () => void;
  spriteInputRef: React.RefObject<HTMLInputElement | null>;
  duplicateSprite: (id: string) => void;
}

export function SpriteGrid({
  sprites,
  activeSpriteId,
  selectSprite,
  deleteSprite,
  addSurpriseSprite,
  openSpriteGallery,
  openPaintEditor,
  spriteInputRef,
  duplicateSprite,
}: SpriteGridProps) {
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; spriteId: string } | null>(null);

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, spriteId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, spriteId });
  };


  return (
    <div className="flex-grow-1 position-relative bg-white" style={{ minHeight: 0, overflow: 'visible' }}>
      {/* SCROLL CONTAINER INTERNO */}
      <div className="p-3 w-100 h-100 position-absolute" style={{ overflowY: 'auto', inset: 0 }}>
        <div className="d-flex flex-wrap gap-2 content-start align-items-start">
          {sprites.map((sprite) => (
            <div
              key={sprite.id}
              className={`sprite-card d-flex flex-column align-items-center justify-content-between p-1 rounded bg-white position-relative group ${activeSpriteId === sprite.id ? 'border-primary ring-2 shadow-sm' : ''}`}
              style={{
                cursor: 'pointer',
                border: activeSpriteId === sprite.id ? '1px solid #4C97FF' : '1px solid #ccc',
              }}
              onContextMenu={(e) => handleContextMenu(e, sprite.id)}
              onClick={() => {
                selectSprite(sprite.id);
                window.dispatchEvent(new CustomEvent('flash-sprite', { detail: sprite.id }));
              }}
            >
              {/* Botão de Excluir Ator (aparece apenas no selecionado) */}
              {sprites.length > 1 && (
                <button
                  className={`position-absolute d-flex align-items-center justify-content-center shadow-sm transition-all border-0 ${activeSpriteId === sprite.id ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'}`}
                  style={{
                    width: '18px',
                    height: '18px',
                    top: '-5px',
                    right: '-5px',
                    zIndex: 20,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    color: '#575e75',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff4d4d';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#575e75';
                  }}
                  onClick={(e) => {
                    if (activeSpriteId === sprite.id) {
                      e.stopPropagation();
                      deleteSprite(sprite.id);
                    }
                    // Se não for o ativo, deixa propagar para o card selecionar o ator
                  }}
                >
                  <i className="bi bi-x-lg" style={{ fontSize: '8px' }}></i>
                </button>
              )}

              <div className="sprite-card-img-area mt-1 px-1">
                <Image
                  src={sprite.costumes?.find((c) => c.id === sprite.currentCostumeId)?.url || sprite.costume || '/img/empty.png'}
                  alt={sprite.name}
                  width={48}
                  height={48}
                  style={{ maxWidth: '100%', objectFit: 'contain' }}
                  unoptimized
                />
              </div>
              <span
                className="sprite-name-label small text-truncate w-100 text-center mb-1 user-select-none"
                style={{ fontSize: '0.7rem', color: '#555' }}
              >
                {sprite.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scratch-style Hover Menu for Adding Sprites */}
      <ScratchAddButton
        mainLabel="Selecione um Ator"
        mainTitle="Escolher um Ator"
        mainIcon="bi-person-plus-fill"
        onMainClick={() => openSpriteGallery()}
        items={[
          { icon: 'bi-upload', title: 'Carregar Ator', onClick: () => spriteInputRef.current?.click() },
          { icon: 'bi-stars', title: 'Surpresa', onClick: () => addSurpriseSprite() },
          { icon: 'bi-brush', title: 'Pintar', onClick: () => openPaintEditor() },
          { icon: 'bi-search', title: 'Procurar', onClick: () => openSpriteGallery() },
        ]}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-[0_2px_10px_rgba(0,0,0,0.15)] border border-gray-200 py-1 rounded-md z-[9999]"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            minWidth: '150px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700 border-0 bg-transparent transition-colors"
            onClick={() => {
              duplicateSprite(contextMenu.spriteId);
              setContextMenu(null);
            }}
            style={{ fontSize: '13px', fontWeight: '500' }}
          >
            duplicar
          </button>
          <div className="h-[1px] bg-gray-200 my-1"></div>
          <button
            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 border-0 bg-transparent transition-colors"
            onClick={() => {
              deleteSprite(contextMenu.spriteId);
              setContextMenu(null);
            }}
            style={{ fontSize: '13px', fontWeight: '500' }}
          >
            apagar
          </button>
        </div>
      )}
    </div>
  );
}
