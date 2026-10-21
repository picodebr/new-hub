import { useEffect, RefObject } from 'react';
/**
 * Sincronização de propriedades de movimento entre blocos e o motor do palco.
 */
import * as Blockly from 'blockly/core';
import { SpriteData } from '@/_base/domain/entities';

/**
 * Hook: useBlocklyMotionSync
 *
 * Responsabilidade: Sincroniza as informações de posição (X, Y) e direção (angle)
 * do ator selecionado no Stage diretamente para as "sombras" (valores padrão)
 * dos blocos de movimento na caixa de ferramentas (flyout), replicando o comportamento do Scratch.
 */
export function useBlocklyMotionSync(workspaceRef: RefObject<Blockly.WorkspaceSvg | null>, activeSprite: SpriteData, isUploadMode: boolean) {
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || isUploadMode || !activeSprite) return;

    // O Blockly guarda a caixa de ferramentas lateral numa "Flyout" associada ao Workspace principal
    const flyout = workspace.getFlyout();
    if (!flyout) return;

    // O Flyout possui um workspace interno onde ficam os blocos gerados a partir da toolbox xml/json
    const flyoutWorkspace = flyout.getWorkspace();
    if (!flyoutWorkspace) return;

    // Buscamos todos os blocos renderizados na toolbox atual
    const blocks = flyoutWorkspace.getAllBlocks(false);

    // Prevenimos rebuilds caros alterando diretamente os campos de entrada nas instâncias SVG existentes.
    // safeNum: garante que não passamos NaN para o campo (activeSprite pode ter valores undefined no início)
    const safeNum = (v: number | undefined) => (isFinite(v as number) ? Math.round(v as number).toString() : '0');

    blocks.forEach((block) => {
      if (block.type === 'va_para_X_e_Y') {
        const xInput = block.getInput('VALUE_X');
        const yInput = block.getInput('VALUE_Y');

        if (xInput && xInput.connection && xInput.connection.targetBlock()) {
          const xBlock = xInput.connection.targetBlock();
          if (xBlock && xBlock.type === 'math_number') {
            const newVal = safeNum(activeSprite.x);
            if (xBlock.getFieldValue('NUM') !== newVal) {
              xBlock.setFieldValue(newVal, 'NUM');
            }
          }
        }

        if (yInput && yInput.connection && yInput.connection.targetBlock()) {
          const yBlock = yInput.connection.targetBlock();
          if (yBlock && yBlock.type === 'math_number') {
            const newVal = safeNum(activeSprite.y);
            if (yBlock.getFieldValue('NUM') !== newVal) {
              yBlock.setFieldValue(newVal, 'NUM');
            }
          }
        }
      } else if (block.type === 'aponte_para_direcao') {
        const angleInput = block.getInput('GRAUS');
        if (angleInput && angleInput.connection && angleInput.connection.targetBlock()) {
          const angleBlock = angleInput.connection.targetBlock();
          if (angleBlock && angleBlock.getField('NUM')) {
            const newVal = safeNum(activeSprite.angle);
            if (angleBlock.getFieldValue('NUM') !== newVal) {
              angleBlock.setFieldValue(newVal, 'NUM');
            }
          }
        }
      }
    });
  }, [workspaceRef, activeSprite, activeSprite?.x, activeSprite?.y, activeSprite?.angle, isUploadMode]);
}
