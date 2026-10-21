/**
 * useKeyboardInput - Gerenciador de Entrada de Teclado Global.
 *
 * Captura eventos de pressionamento de tecla em toda a janela e despacha para
 * os atores que possuem blocos "quando a tecla [pressionada]". Ele lida tanto
 * com o ator ativo quanto com atores em segundo plano (via Headless Runner).
 */
/**
 * Captura e redirecionamento de eventos de teclado para o palco de simulação.
 */
import { useEffect, useRef } from 'react';
import { useExecutionRunner } from '../../context/RuntimeContext';
import { useUI } from '../../context/UIContext';
import { useProject } from '../../context/ProjectContext';
import { HeadlessBlocklyRunner } from '../../lib/HeadlessBlocklyRunner';
import { BlocklyWorkspaceRef } from '../../domain/entities/IBlockly';

type ExecuteSpriteCodeFn = (spriteId: string, code: string) => Promise<void>;

export function useKeyboardInput(blocklyRef: React.RefObject<BlocklyWorkspaceRef | null>, executeSpriteCode: ExecuteSpriteCodeFn) {
  const stageContext = useExecutionRunner();
  const { isUploadMode } = useUI();
  // board removed
  const { sprites, activeSpriteId } = useProject();

  const { setForceExecution } = stageContext;

  const spritesRef = useRef(sprites);
  const activeSpriteIdRef = useRef(activeSpriteId);
  const executeSpriteCodeRef = useRef(executeSpriteCode);

  useEffect(() => {
    spritesRef.current = sprites;
    activeSpriteIdRef.current = activeSpriteId;
    executeSpriteCodeRef.current = executeSpriteCode;
  }, [sprites, activeSpriteId, executeSpriteCode]);

  useEffect(() => {
    // REGISTRO DO EVENT LISTENER:
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (isUploadMode) return;

      const key = e.key;

      if (key === ' ') e.preventDefault();

      if (setForceExecution) setForceExecution(true);

      try {
        const executionPromises: Promise<void>[] = [];

        for (const sprite of spritesRef.current) {
          let codeToRun = '';

          if (sprite.id === activeSpriteIdRef.current) {
            if (blocklyRef.current) {
              const activeCode = blocklyRef.current.checkKeyEvents(key);
              if (activeCode) codeToRun = activeCode;
            }
          } else {
            if (sprite.blocks) {
              codeToRun = HeadlessBlocklyRunner.getKeyPressCode(sprite.blocks, key);
            }
          }

          if (codeToRun) {
            executionPromises.push(executeSpriteCodeRef.current(sprite.id, codeToRun));
          }
        }

        if (executionPromises.length > 0) {
          await Promise.all(executionPromises);
        }
      } finally {
        if (setForceExecution) setForceExecution(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setForceExecution, blocklyRef, isUploadMode]);
}
