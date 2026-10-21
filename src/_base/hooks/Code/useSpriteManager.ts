/**
 * useSpriteManager - Sincronizador reativo da coleção de atores e cenários.
 *
 * Responsabilidade: Manter o estado local do React sincronizado com o Singleton
 * `ProjectService`. Abstrai as operações de CRUD de sprites e backdrops,
 * centralizando a subscrição de eventos de mudança para garantir que a interface
 * reaja instantaneamente a alterações no modelo de dados.
 */
/**
 * Gerenciamento de ciclo de vida e propriedades visuais dos atores no palco.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SpriteData, BackdropData, IBlocklyWorkspaceJson, SpriteVariable } from '../../domain/entities';
import { getProjectService } from '@/_base/services/code';

export function useSpriteManager() {
  const projectService = getProjectService();

  // Estado Local (Sincronizado com o Service)
  const [sprites, setSprites] = useState<SpriteData[]>(projectService.getSprites());
  const [activeSpriteId, setActiveSpriteId] = useState<string>(projectService.getActiveSpriteId());

  const [backdrops, setBackdrops] = useState<BackdropData[]>(projectService.getBackdrops());
  const [activeBackdropId, setActiveBackdropId] = useState<string>(projectService.getActiveBackdropId());

  // Ref estável para tracking de revisão (evita closure stale)
  const lastRevisionRef = useRef(projectService.getStateRevision());
  // Ref estável para o service (evita recreação do RAF loop)
  const projectServiceRef = useRef(projectService);

  useEffect(() => {
    // Meta-eventos (mudanças estruturais de baixa frequência): seleção de ator/cenário ativo.
    // Esses eventos são raros e devem disparar React state imediatamente para atualizar
    // a UI de seleção (ex: painel de propriedades, aba do Blockly).
    const handleActiveSpriteChange = (id: string) => {
      setActiveSpriteId(id);
    };

    const handleActiveBackdropChange = (id: string) => {
      setActiveBackdropId(id);
    };

    projectServiceRef.current.on('activeSpriteChange', handleActiveSpriteChange);
    projectServiceRef.current.on('activeBackdropChange', handleActiveBackdropChange);

    // PADRÃO PUSH/PULL para dados de alta frequência (sprites, backdrops):
    // Em vez de escutar eventos 'spritesChange'/'backdropChange' que podem disparar
    // dezenas de vezes por segundo durante uma animação, usamos um RAF heartbeat
    // throttled a 30fps com verificação de revisão.
    //
    // POR QUE 30fps E NÃO 60fps:
    // O WebGL renderiza a 60fps de forma totalmente independente do React, lendo
    // diretamente do ProjectService via getProjectService(). React não precisa saber
    // das posições dos sprites a 60fps — 30fps é suficiente para atualizar a SpriteGrid,
    // o painel de propriedades e a lista de monitores.
    //
    // Rodar a 60fps aqui cascatearia: syncLoop → setSprites → RuntimeContext.stateValue
    // recalcula → todo consumidor de useExecutionRunner re-renderiza 60 vezes por segundo.
    let frameId: number;
    let lastSyncTime = performance.now();
    const SYNC_INTERVAL_MS = 1000 / 30; // 30 FPS — alinhado com o ProjectContext

    const syncLoop = (time: number) => {
      if (time - lastSyncTime >= SYNC_INTERVAL_MS) {
        const currentRev = projectServiceRef.current.getStateRevision();
        if (currentRev !== lastRevisionRef.current) {
          // Ambos os setStates são agrupados pelo React 18 automatic batching
          // em um único re-render, pois executam no mesmo callback síncrono.
          setSprites([...projectServiceRef.current.getSprites()]);
          setBackdrops([...projectServiceRef.current.getBackdrops()]);
          lastRevisionRef.current = currentRev;
        }
        lastSyncTime = time;
      }
      frameId = requestAnimationFrame(syncLoop);
    };
    frameId = requestAnimationFrame(syncLoop);

    return () => {
      cancelAnimationFrame(frameId);
      projectServiceRef.current.off('activeSpriteChange', handleActiveSpriteChange);
      projectServiceRef.current.off('activeBackdropChange', handleActiveBackdropChange);
    };
  }, []); // DEPENDÊNCIA VAZIA - executa só na montagem, refs são estáveis

  // --- Ações (Proxy para o Service) ---
  // Usa refs para evitar closure stale e re-criação desnecessária

  const addSprite = useCallback((file?: File) => {
    projectServiceRef.current.addSprite(file);
  }, []);

  const deleteSprite = useCallback((id: string) => {
    projectServiceRef.current.deleteSprite(id);
  }, []);

  const selectSprite = useCallback((id: string) => {
    projectServiceRef.current.selectSprite(id);
  }, []);

  const updateSpriteInfo = useCallback((id: string, changes: Partial<SpriteData>) => {
    projectServiceRef.current.updateSprite(id, changes);
  }, []);

  const updateSpriteBlocks = useCallback((id: string, blocks: IBlocklyWorkspaceJson, code: string, variables?: SpriteVariable[]) => {
    projectServiceRef.current.updateSpriteBlocks(id, blocks, code, variables);
  }, []);

  // --- Ações de Cenário ---
  const addBackdrop = useCallback((file: File) => {
    projectServiceRef.current.addBackdrop(file);
  }, []);

  const deleteBackdrop = useCallback((id: string) => {
    projectServiceRef.current.deleteBackdrop(id);
  }, []);

  const selectBackdrop = useCallback((id: string) => {
    projectServiceRef.current.setActiveBackdropId(id);
  }, []);

  const switchBackdrop = useCallback(async (idOrType: string) => {
    await projectServiceRef.current.switchBackdrop(idOrType);
  }, []);

  // Setters Expostos para o ProjectManager (Carga)
  const setSpritesExternal = useCallback((newSprites: SpriteData[]) => {
    projectServiceRef.current.setSprites(newSprites);
  }, []);

  const setActiveSpriteIdExternal = useCallback((id: string) => {
    projectServiceRef.current.setActiveSpriteId(id);
  }, []);

  const setBackdropsExternal = useCallback((newBackdrops: BackdropData[]) => {
    projectServiceRef.current.setBackdrops(newBackdrops);
  }, []);

  const setActiveBackdropIdExternal = useCallback((id: string) => {
    projectServiceRef.current.setActiveBackdropId(id);
  }, []);

  return useMemo(
    () => ({
      sprites,
      activeSpriteId,
      backdrops,
      activeBackdropId,
      // Métodos
      addSprite,
      deleteSprite,
      selectSprite,
      updateSpriteInfo,
      updateSpriteBlocks,
      addBackdrop,
      deleteBackdrop,
      selectBackdrop,
      switchBackdrop,
      // Setters Externos (Carga de Projeto)
      setSpritesExternal,
      setActiveSpriteIdExternal,
      setBackdropsExternal,
      setActiveBackdropIdExternal,
    }),
    [
      sprites,
      activeSpriteId,
      backdrops,
      activeBackdropId,
      addSprite,
      deleteSprite,
      selectSprite,
      updateSpriteInfo,
      updateSpriteBlocks,
      addBackdrop,
      deleteBackdrop,
      selectBackdrop,
      switchBackdrop,
      setSpritesExternal,
      setActiveSpriteIdExternal,
      setBackdropsExternal,
      setActiveBackdropIdExternal,
    ],
  );
}
