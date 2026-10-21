/**
 * SpriteList - Orquestrador da gestão de ativos do projeto (Atores e Cenários).
 *
 * Responsabilidade: Coordenar as sub-visualizações de propriedades, listagem
 * de atores (Grid) e gestão de cenários (StageColumn). Atua como a ponte
 * principal para a criação, deleção e seleção de recursos visuais do projeto,
 * além de disparar modais de galeria e o editor de pintura (Paint Editor).
 */

/**
 * Listagem e gestão de atores (sprites) ativos no projeto atual.
 */
'use client';

import React from 'react';
import Image from 'next/image';
import { SpriteGalleryModal } from '../modals/SpriteGalleryModal';
import { BackdropGalleryModal } from '../modals/BackdropGalleryModal';
import { SpritePropertiesPanel } from './SpritePropertiesPanel';
import { SpriteGrid } from './SpriteGrid';
import { StageColumn } from '../stage/StageColumn';
import { useProject } from '@/_base/context/ProjectContext';
import { useUI } from '@/_base/context/UIContext';
import { BackdropData } from '@/_base/domain/entities';

export default function SpriteList() {
  // Acessa dados consolidados do Projeto (Atores e Cenários)
  const {
    sprites,
    activeSpriteId,
    addSprite,
    deleteSprite,
    selectSprite,
    backdrops,
    addBackdrop,
    selectBackdrop,
    deleteBackdrop,
    activeBackdrop,
    addCostumeToSprite,
    removeCostumeFromSprite,
    getSpriteById,
    updateSprite,
    switchCostume: projectSwitchCostume,
    addSurpriseSprite,
    addSurpriseBackdrop,
    lastRealSpriteId,
    duplicateSprite,
  } = useProject();

  // Filtra para mostrar apenas atores reais na lista (clones aparecem apenas no palco)
  const realSprites = React.useMemo(() => sprites.filter((s) => !s.isClone), [sprites]);

  const { setActiveTab } = useUI();

  // switchCostume removed

  const backdropImage = (activeBackdrop as BackdropData)?.url ?? '/svg/Backdrops/vazio.svg';

  // Estados para modais
  const [isBackdropModalOpen, setIsBackdropModalOpen] = React.useState(false);
  const [isBackdropGalleryOpen, setIsBackdropGalleryOpen] = React.useState(false);
  const [isCostumeModalOpen, setIsCostumeModalOpen] = React.useState(false);
  const [isSpriteGalleryOpen, setIsSpriteGalleryOpen] = React.useState(false);

  // Refs
  const backdropInputRef = React.useRef<HTMLInputElement>(null);
  const costumeInputRef = React.useRef<HTMLInputElement>(null);
  const spriteInputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    const handleWidthChange = (e: any) => {
      setStageWidth(e.detail);
    };
    window.addEventListener('stage-width-changed', handleWidthChange);
    return () => window.removeEventListener('stage-width-changed', handleWidthChange);
  }, []);

  const activeSprite = getSpriteById(activeSpriteId);

  // O sprite que será exibido no painel de propriedades.
  // Se o palco estiver selecionado, mantém as propriedades do último ator real visível.
  const displaySprite = activeSpriteId === 'stage' ? (getSpriteById(lastRealSpriteId) ?? null) : (activeSprite ?? null);

  // Handlers para ações de pintura (abrir o Paint Editor)
  const handleOpenPaintEditorForSprite = async () => {
    await addSprite();
    setActiveTab('costumes');
  };

  const handleOpenPaintEditorForBackdrop = async () => {
    await addBackdrop();
    selectSprite('stage');
    setActiveTab('costumes');
  };

  return (
    <React.Fragment>
      <div
        className="sprite-management-area h-100 d-flex w-100"
        ref={containerRef}
        style={{ maxWidth: stageWidth ? `${stageWidth + 3}px` : '485px' }}
      >
        {/* COLUNA ESQUERDA: Propriedades + Lista de Atores */}
        <div
          className="d-flex flex-column flex-grow-1 bg-white border overflow-hidden position-relative"
          style={{ borderColor: '#ccc', minWidth: 0, borderRadius: '16px' }}
        >
          {/* 1. PAINEL DE PROPRIEDADES */}
          {displaySprite ? (
            <SpritePropertiesPanel displaySprite={displaySprite} updateSprite={updateSprite} />
          ) : (
            <div className="properties-panel border-bottom bg-white" style={{ minHeight: '60px' }}></div>
          )}

          {/* 2. LISTA DE ATORES (SPRITES) */}
          <SpriteGrid
            sprites={realSprites}
            activeSpriteId={activeSpriteId}
            selectSprite={selectSprite}
            deleteSprite={deleteSprite}
            addSurpriseSprite={addSurpriseSprite}
            openSpriteGallery={() => setIsSpriteGalleryOpen(true)}
            openPaintEditor={handleOpenPaintEditorForSprite}
            spriteInputRef={spriteInputRef}
            duplicateSprite={duplicateSprite}
          />
        </div>

        {/* COLUNA DIREITA: PALCO (STAGE) */}
        <StageColumn
          activeSpriteId={activeSpriteId}
          backdropImage={backdropImage}
          activeBackdropName={(activeBackdrop as BackdropData)?.name}
          backdrops={backdrops}
          selectSprite={selectSprite}
          addSurpriseBackdrop={addSurpriseBackdrop}
          openBackdropGallery={() => setIsBackdropGalleryOpen(true)}
          openPaintEditor={handleOpenPaintEditorForBackdrop}
          backdropInputRef={backdropInputRef}
        />
      </div>

      {/* MODALS AQUI (GALERIA DE CENÁRIOS/FANTASIAS INDIVIDUAIS INLINE) */}

      {/* MODAL: GALERIA DE CENÁRIOS INLINE DO PROPRIO PROJETO (Gerenciar exclusão) */}
      {isBackdropModalOpen && (
        <div
          className="modal-backdrop-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={() => setIsBackdropModalOpen(false)}
        >
          <div
            className="bg-white rounded shadow-lg d-flex flex-column"
            style={{ width: '600px', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="m-0">Galeria de Cenários</h5>
              <button className="btn-close" onClick={() => setIsBackdropModalOpen(false)}></button>
            </div>
            <div className="p-3 overflow-auto flex-grow-1">
              <div className="d-flex flex-wrap gap-3">
                {backdrops.map((bd) => (
                  <div
                    key={bd.id}
                    className={`rounded p-1 cursor-pointer position-relative ${backdropImage === bd.url ? 'border border-primary ring-2' : ''}`}
                    style={{ width: '120px', height: '100px', cursor: 'pointer' }}
                    onClick={() => {
                      selectBackdrop(bd.id);
                    }}
                  >
                    {backdrops.length > 1 && (
                      <button
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-0 d-flex align-items-center justify-content-center"
                        style={{ width: '20px', height: '20px', transform: 'translate(30%, -30%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBackdrop(bd.id);
                        }}
                      >
                        <i className="bi bi-x" style={{ fontSize: '12px' }}></i>
                      </button>
                    )}
                    <div className="w-100 h-100 overflow-hidden bg-light d-flex align-items-center justify-content-center">
                      {bd.url ? (
                        <Image
                          src={bd.url}
                          alt={bd.name}
                          width={120}
                          height={90}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="text-center small mt-1 text-truncate">{bd.name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 border-top text-end">
              <button className="btn btn-primary" onClick={() => setIsBackdropModalOpen(false)}>
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GALERIA DE FANTASIAS INLINE (Para o ator selecionado gerenciar exclusão) */}
      {isCostumeModalOpen && activeSprite && (
        <div
          className="modal-costume-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          onClick={() => setIsCostumeModalOpen(false)}
        >
          <div
            className="bg-white rounded shadow-lg d-flex flex-column"
            style={{ width: '600px', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="m-0">Fantasias: {activeSprite.name}</h5>
              <button className="btn-close" onClick={() => setIsCostumeModalOpen(false)}></button>
            </div>
            <div className="p-3 overflow-auto flex-grow-1">
              <div className="d-flex flex-wrap gap-3">
                {activeSprite.costumes &&
                  activeSprite.costumes.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded p-1 cursor-pointer position-relative ${activeSprite.currentCostumeId === c.id ? 'border border-primary ring-2' : ''}`}
                      style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                      onClick={() => {
                        projectSwitchCostume(activeSprite.id, c.id);
                      }}
                    >
                      {activeSprite.costumes.length > 1 && (
                        <button
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-0 d-flex align-items-center justify-content-center"
                          style={{ width: '20px', height: '20px', transform: 'translate(30%, -30%)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCostumeFromSprite(activeSprite.id, c.id);
                          }}
                        >
                          <i className="bi bi-x" style={{ fontSize: '12px' }}></i>
                        </button>
                      )}
                      <div className="w-100 h-100 overflow-hidden bg-white d-flex align-items-center justify-content-center">
                        <Image
                          src={c.url}
                          alt={c.name}
                          width={48}
                          height={48}
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                          unoptimized
                        />
                      </div>
                      <div className="text-center small mt-1 text-truncate">{c.name}</div>
                    </div>
                  ))}

                <input
                  type="file"
                  accept="image/*"
                  ref={costumeInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      addCostumeToSprite(activeSprite.id, e.target.files[0]);
                    }
                  }}
                />

                <div
                  className="rounded p-1 d-flex flex-column align-items-center justify-content-center bg-light text-secondary"
                  style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                  onClick={() => costumeInputRef.current?.click()}
                >
                  <i className="bi bi-plus-lg h4 mb-0"></i>
                  <span className="small">Nova</span>
                </div>
              </div>
            </div>
            <div className="p-3 border-top text-end">
              <button className="btn btn-primary" onClick={() => setIsCostumeModalOpen(false)}>
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GALERIA DE ATORES (Para adicionar novos) */}
      <SpriteGalleryModal isOpen={isSpriteGalleryOpen} onClose={() => setIsSpriteGalleryOpen(false)} />
      {/* MODAL: GALERIA DE CENÁRIOS (Para adicionar novos) */}
      <BackdropGalleryModal isOpen={isBackdropGalleryOpen} onClose={() => setIsBackdropGalleryOpen(false)} />

      {/* Inputs ocultos para carregar Ator e Cenário (Nível Global) */}
      <input
        type="file"
        accept="image/*"
        ref={spriteInputRef}
        style={{ display: 'none' }}
        onChange={async (e) => {
          if (e.target.files && e.target.files[0]) {
            await addSprite(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />
      <input
        type="file"
        accept="image/*"
        ref={backdropInputRef}
        style={{ display: 'none' }}
        onChange={async (e) => {
          if (e.target.files && e.target.files[0]) {
            await addBackdrop(e.target.files[0]);
            setActiveTab('costumes');
            e.target.value = '';
          }
        }}
      />
    </React.Fragment>
  );
}
