/**
 * StageColumn - Coluna lateral do Palco (Cenários).
 *
 * Responsabilidade: Exibir a miniatura do cenário ativo e fornecer
 * um menu flutuante estilo Scratch para adicionar, pintar ou buscar
 * novos cenários (backdrops). Também permite selecionar o palco
 * como alvo ativo para edição de blocos de cenário.
 */
import React from 'react';
import Image from 'next/image';
import { BackdropData } from '@/_base/domain/entities';
import { ScratchAddButton } from '../shared/ScratchAddButton';

interface StageColumnProps {
  activeSpriteId: string;
  backdropImage: string;
  activeBackdropName?: string;
  backdrops: BackdropData[];
  selectSprite: (id: string) => void;
  addSurpriseBackdrop: () => void;
  openBackdropGallery: () => void;
  openPaintEditor: () => void;
  backdropInputRef: React.RefObject<HTMLInputElement | null>;
}

export function StageColumn({
  activeSpriteId,
  backdropImage,
  activeBackdropName,
  backdrops,
  selectSprite,
  addSurpriseBackdrop,
  openBackdropGallery,
  openPaintEditor,
  backdropInputRef,
}: StageColumnProps) {
  const isSelected = activeSpriteId === 'stage';

  return (
    <div className={`stage-selector-panel${isSelected ? ' stage-selector-panel--selected' : ''}`} onClick={() => selectSprite('stage')}>
      {/* Header — fica roxo quando selecionado, igual ao Scratch */}
      <div className="stage-selector-panel__header">
        <span className="stage-selector-panel__header-title">Palco</span>
      </div>

      {/* Miniatura do cenário ativo */}
      <div className="stage-selector-panel__thumbnail">
        {backdropImage ? (
          <Image
            src={backdropImage}
            alt="Stage"
            width={64}
            height={48}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            unoptimized
          />
        ) : null}
      </div>

      {/* Label e contagem de cenários */}
      <div className="stage-selector-panel__label" title={activeBackdropName || 'Cenários'}>
        {activeBackdropName || 'Cenários'}
      </div>
      <div className="stage-selector-panel__count">480 x 360</div>

      {/* Botão flutuante estilo Scratch para adicionar cenários */}
      <div onClick={(e) => e.stopPropagation()}>
        <ScratchAddButton
          mainLabel="Selecionar Cenário"
          mainTitle="Escolher um Cenário"
          mainIcon="bi-image-fill"
          center={true}
          onMainClick={() => openBackdropGallery()}
          items={[
            { icon: 'bi-upload', title: 'Carregar Cenário', onClick: () => backdropInputRef.current?.click() },
            { icon: 'bi-stars', title: 'Surpresa', onClick: () => addSurpriseBackdrop() },
            { icon: 'bi-brush', title: 'Pintar', onClick: () => openPaintEditor() },
            { icon: 'bi-search', title: 'Procurar', onClick: () => openBackdropGallery() },
          ]}
        />
      </div>
    </div>
  );
}
