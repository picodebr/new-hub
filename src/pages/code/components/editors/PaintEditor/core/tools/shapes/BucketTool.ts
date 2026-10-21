/**
 * BucketTool - Preenchimento de formas (Balde de Tinta).
 *
 * Responsabilidade: Identificar caminhos fechados sob o cursor e aplicar
 * a cor de preenchimento do estado atual. Funciona através de HitTesting
 * nos limites internos das formas vetoriais.
 */
import type * as paper from 'paper';

import { BaseTool } from '../BaseTool';
import { IPaintItem } from '@/_base/domain/entities/IPaintEditor';

export class BucketTool extends BaseTool {
  protected setupHandlers() {
    this.tool.onMouseDown = (event: paper.ToolEvent) => {
      const realPoint = this.getRealPoint(event);
      const currentZoom = this.scope.view.zoom;

      // Tolerância dinâmica: escala com o zoom
      const tolerance = 6 / currentZoom;

      // Hit test buscando o item mais no topo (front-to-back)
      // O paper.js naturalmente entra em grupos ao fazer hit-test com fill:true
      const hitResult = this.drawingLayer.hitTest(realPoint, {
        fill: true,
        stroke: true,
        segments: true,
        curves: true,
        tolerance: tolerance,
        match: (hit: paper.HitResult) => !hit.item.locked && !(hit.item as IPaintItem).guide,
      });

      if (hitResult) {
        // Atua diretamente sobre o item específico atingido (descendo nos SVGs importados)
        const item = hitResult.item;

        // Se acertou o contorno (stroke, segment ou curve) do item e NÃO o fill
        if (hitResult.type === 'stroke' || hitResult.type === 'segment' || hitResult.type === 'curve') {
          item.strokeColor = this.fillColor; // O Scratch chama isso de contorno
          if (item.strokeWidth && item.strokeWidth < 0.5) {
            item.strokeWidth = 2 / currentZoom;
          }
        } else {
          // Senão (foi um hit de preenchimento), altera o fillColor do item
          item.fillColor = this.fillColor;
        }

        this.saveHistory();
      }
    };
  }
}
