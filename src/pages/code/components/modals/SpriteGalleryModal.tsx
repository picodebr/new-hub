/**
 * SpriteGalleryModal - Catálogo de personagens (Atores).
 *
 * Responsabilidade: Exibir uma grade de atores disponíveis na biblioteca,
 * permitir a busca por nome e injetar o ator selecionado no projeto global.
 * Utiliza o 'LibraryService' para simular chamadas assíncronas a um banco de dados.
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useProject } from '@/_base/context/ProjectContext';
import { LibrarySprite } from '@/_base/config/sprite_library';
import { getLibraryService } from '@/_base/services/code';

interface SpriteGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpriteGalleryModal: React.FC<SpriteGalleryModalProps> = ({ isOpen, onClose }) => {
  const { addSpriteFromLibrary } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [sprites, setSprites] = useState<LibrarySprite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSprites = async () => {
        setLoading(true);
        setError(null);
        try {
          // SIMULAÇÃO DE BANCO DE DADOS:
          // Centralizamos a busca de metadados no LibraryService para
          // facilitar a migração futura para uma API REST real.
          const data = await getLibraryService().getCharacters();
          setSprites(data);
        } catch {
          setError('Não foi possível carregar a galeria de atores.');
        } finally {
          setLoading(false);
        }
      };
      fetchSprites();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSprites = sprites.filter((sprite) => sprite.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectSprite = async (sprite: LibrarySprite) => {
    await addSpriteFromLibrary(sprite.name, sprite.url, sprite.costumes, sprite.sounds);
    onClose();
  };

  return createPortal(
    <div
      className="modal-sprite-gallery-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000000, backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4 shadow-lg d-flex flex-column overflow-hidden border border-white/20"
        style={{ width: '800px', height: '80vh', maxWidth: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light">
          <div>
            <h4 className="m-0 fw-bold text-primary">Escolher um Ator</h4>
            <p className="m-0 text-secondary small">Selecione um personagem para adicionar ao seu projeto (Simulando Banco de Dados)</p>
          </div>
          <button className="btn-close shadow-none" onClick={onClose} aria-label="Close"></button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 bg-white border-bottom">
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
            <input
              type="text"
              className="form-control form-control-lg ps-5 shadow-sm border-2"
              placeholder="Procurar atores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: '12px' }}
              disabled={loading}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="p-4 overflow-auto flex-grow-1 bg-slate-50 d-flex flex-column">
          {loading ? (
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center py-5">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-secondary fw-bold">Puxando personagens do &quot;Banco de Dados&quot;...</p>
            </div>
          ) : error ? (
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-danger py-5">
              <i className="bi bi-exclamation-triangle-fill h1"></i>
              <p className="fw-bold">{error}</p>
              <button className="btn btn-outline-danger mt-2" onClick={() => window.location.reload()}>
                Tentar Novamente
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {filteredSprites.map((sprite, index) => (
                <div key={index} className="col-6 col-sm-4 col-md-3">
                  <div
                    className="sprite-library-card h-100 rounded-4 bg-white border border-2 shadow-sm d-flex flex-column align-items-center justify-content-center transition-all cursor-pointer hover-scale overflow-hidden"
                    onClick={() => handleSelectSprite(sprite)}
                    style={{ transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4483ff';
                      e.currentTarget.style.boxShadow = '0 10px 20px rgba(68,131,255,0.15)';
                      e.currentTarget.style.transform = 'translateY(-5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#eee';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="w-100 flex-grow-1 d-flex align-items-center justify-content-center p-3" style={{ height: '100px', overflow: 'hidden' }}>
                      <Image
                        src={sprite.costumes && sprite.costumes.length > 0 ? sprite.costumes[0].url : sprite.url}
                        alt={sprite.name}
                        width={100}
                        height={100}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        className="filter drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                        unoptimized
                      />
                    </div>
                    <div className="w-100 px-2 pb-2 pt-1" style={{ backgroundColor: '#4483ff', borderRadius: '0 0 16px 16px' }}>
                      <div className="fw-bold text-center text-white text-truncate w-100" style={{ fontSize: '11px', lineHeight: '1.2' }}>{sprite.name}</div>
                      <div className="text-white/80 text-center w-100" style={{ fontSize: '9px', lineHeight: '1.2' }}>120 × 120</div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredSprites.length === 0 && !loading && (
                <div className="text-center py-5 w-100">
                  <i className="bi bi-search text-secondary opacity-25" style={{ fontSize: '4rem' }}></i>
                  <h5 className="mt-3 text-secondary">Nenhum ator encontrado para &quot;{searchTerm}&quot;</h5>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-top bg-light text-end">
          <button className="btn btn-secondary px-4 fw-bold" onClick={onClose} style={{ borderRadius: '10px' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
