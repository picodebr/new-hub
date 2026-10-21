import { BaseTool } from './BaseTool';
import { DRAWING_CONFIG, SVG_ID_WHITELIST } from '../../constants';
import { IPaintItem, IPaintHitOptions, IPaintWindow } from '@/_base/domain/entities/IPaintEditor';
import { BoundingBox } from './BoundingBox';

export class SelectTool extends BaseTool {
  private dragItem: paper.Item | null = null;
  private hasMoved = false;
  private selectionRect: paper.Path | null = null;
  private selectStartPoint: paper.Point | null = null;

  private caixaDelimitadora!: BoundingBox;
  private interactionMode: string | null = null;
  private transformOrigin: paper.Point | null = null;
  private lastAngle: number = 0;

  // Clones de highlight (contorno azul + sombra) na highlightLayer
  private highlightClones: Map<number, paper.Item> = new Map();
  private highlightLayer: paper.Layer | null = null;
  public onLiveSync?: () => void;


  private hitOptions: IPaintHitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 2,
    match: (hit: paper.HitResult) => !hit.item.locked && !(hit.item as IPaintItem).guide && hit.item.name !== 'bounding-box',
  };

  private lastRealPoint: paper.Point | null = null;

  protected setupHandlers() {
    this.tool.onMouseDown = (event: paper.ToolEvent) => {
      if (!this.caixaDelimitadora) {
        this.caixaDelimitadora = new BoundingBox(this.scope);
      }
      this.hasMoved = false;

      const realPoint = this.getRealPoint(event);
      this.lastRealPoint = realPoint;

      // 1. GESTÃO DE ALÇAS (HANDLES):
      // Verificamos primeiro se o clique ocorreu em alguma alça da caixa de
      // seleção (os quadradinhos nos cantos ou no topo).
      const handleHit = this.caixaDelimitadora.testarColisaoAlcas(realPoint);
      if (handleHit) {
        this.interactionMode = handleHit;
        const selectedItems = this.getSelectedItems();

        if (selectedItems.length > 0) {
          if (this.interactionMode === 'rotate') {
            // CÁLCULO DE ÂNGULO INICIAL:
            // Guardamos o ângulo do clique em relação ao centro da seleção
            // para calcular o delta de rotação durante o arrasto.
            const center = this.caixaDelimitadora.obterLimites().center;
            this.lastAngle = realPoint.subtract(center).angle;
          } else if (this.interactionMode.startsWith('scale-')) {
            // DEFINIÇÃO DA ORIGEM DE TRANSFORMAÇÃO:
            // Ao escalar pelo canto superior esquerdo (tl), o ponto fixo
            // (âncora) deve ser o canto inferior direito (br).
            const b = this.caixaDelimitadora.obterLimites();
            const oppMap: Record<string, paper.Point> = {
              tl: b.bottomRight,
              tc: b.bottomCenter,
              tr: b.bottomLeft,
              rc: b.leftCenter,
              br: b.topLeft,
              bc: b.topCenter,
              bl: b.topRight,
              lc: b.rightCenter,
            };
            const handleTarget = this.interactionMode.split('-')[1];
            this.transformOrigin = oppMap[handleTarget];
          }
        }
        return;
      }

      // Tolerância dinâmica baseada no zoom
      const currentZoom = this.scope.view.zoom;
      const dynamicTolerance = 5 / currentZoom;
      const currentHitOptions = { ...this.hitOptions, tolerance: dynamicTolerance };

      // 2. Hit test no projeto
      const hitResult = this.scope.project.hitTest(realPoint, currentHitOptions);

      if (hitResult) {
        const item = this.getSelectableUnit(hitResult.item);

        if (!event.modifiers.shift) {
          if (!item.selected) {
            this.clearSelection();
            item.selected = true;
          }
        } else {
          item.selected = !item.selected;
        }

        if (item.selected) {
          this.dragItem = item;
          this.interactionMode = 'move';

          const win = window as unknown as IPaintWindow;
          if (item.fillColor) win.__p_setFillColor?.(item.fillColor.toCSS(true));
          if (item.strokeColor) win.__p_setStrokeColor?.(item.strokeColor.toCSS(true));
        } else {
          this.dragItem = null;
          this.interactionMode = null;
        }
      } else {
        // 3. Clicou dentro da área de seleção
        if (this.caixaDelimitadora.testarColisaoCaixa(realPoint)) {
          this.interactionMode = 'move';
          this.dragItem = null;
        } else {
          // 4. Fora — inicia seleção por arrastar ou limpa
          if (!event.modifiers.shift) {
            this.clearSelection();
          }
          this.dragItem = null;
          this.interactionMode = null;
          this.selectStartPoint = realPoint;
        }
      }

      this.updateBoundingBox();
    };

    this.tool.onMouseDrag = (event: paper.ToolEvent) => {
      const selectedItems = this.getSelectedItems();
      const realPoint = this.getRealPoint(event);
      const realDelta = this.lastRealPoint ? realPoint.subtract(this.lastRealPoint) : event.delta;

      if (this.interactionMode && selectedItems.length > 0) {
        if (this.interactionMode === 'rotate') {
          const center = this.caixaDelimitadora.obterLimites().center;
          const currentAngle = realPoint.subtract(center).angle;
          const deltaAngle = currentAngle - this.lastAngle;

          selectedItems.forEach((item) => item.rotate(deltaAngle, center));
          this.lastAngle = currentAngle;
          this.hasMoved = true;

          // ✨ NOVO: Esconde a bounding box durante o giro para focar no contorno
          this.caixaDelimitadora.esconder();

          // Mas mantém o brilho sincronizado
          this.syncHighlightClones(selectedItems);

          this.lastRealPoint = realPoint;
          this.onLiveSync?.();
          return;
        }

        if (this.interactionMode.startsWith('scale-')) {
          const handleTarget = this.interactionMode.split('-')[1];
          const origin = this.transformOrigin!;
          const lastVec = this.lastRealPoint!.subtract(origin);
          const curVec = realPoint.subtract(origin);

          let sx = 1,
            sy = 1;
          if (['tl', 'tr', 'bl', 'br', 'lc', 'rc'].includes(handleTarget)) {
            if (Math.abs(lastVec.x) > 0.01) sx = curVec.x / lastVec.x;
          }
          if (['tl', 'tr', 'bl', 'br', 'tc', 'bc'].includes(handleTarget)) {
            if (Math.abs(lastVec.y) > 0.01) sy = curVec.y / lastVec.y;
          }

          if (!isFinite(sx) || sx === 0) sx = 1;
          if (!isFinite(sy) || sy === 0) sy = 1;

          if (event.modifiers.shift && ['tl', 'tr', 'bl', 'br'].includes(handleTarget)) {
            const maxS = Math.max(Math.abs(sx), Math.abs(sy));
            sx = sx < 0 ? -maxS : maxS;
            sy = sy < 0 ? -maxS : maxS;
          }

          // TRAVAS DE SEGURANÇA (MIN/MAX SIZE):
          // Evita que o usuário inverta a forma acidentalmente (reflexão não intencional)
          // ou crie objetos excessivamente pequenos/grandes que causem
          // instabilidade matemática ou erros de renderização no Paper.js.
          let totalBounds: paper.Rectangle | null = null;
          selectedItems.forEach((item) => {
            if (!totalBounds) totalBounds = item.bounds.clone();
            else totalBounds = totalBounds.unite(item.bounds);
          });

          if (totalBounds) {
            const tb = totalBounds as paper.Rectangle;

            if (tb.width > 1) {
              const nextW = tb.width * Math.abs(sx);
              if (nextW < DRAWING_CONFIG.minItemSize && Math.abs(sx) < 1) {
                sx = (sx < 0 ? -1 : 1) * (DRAWING_CONFIG.minItemSize / tb.width);
              }
              if (nextW > DRAWING_CONFIG.maxItemSize && Math.abs(sx) > 1) {
                sx = (sx < 0 ? -1 : 1) * (DRAWING_CONFIG.maxItemSize / tb.width);
              }
            }

            if (tb.height > 1) {
              const nextH = tb.height * Math.abs(sy);
              if (nextH < DRAWING_CONFIG.minItemSize && Math.abs(sy) < 1) {
                sy = (sy < 0 ? -1 : 1) * (DRAWING_CONFIG.minItemSize / tb.height);
              }
              if (nextH > DRAWING_CONFIG.maxItemSize && Math.abs(sy) > 1) {
                sy = (sy < 0 ? -1 : 1) * (DRAWING_CONFIG.maxItemSize / tb.height);
              }
            }
          }

          // Aplica a escala final já travada em todos os itens
          selectedItems.forEach((item) => item.scale(sx, sy, origin));

          this.hasMoved = true;
          this.updateBoundingBox();
          this.lastRealPoint = realPoint;
          this.onLiveSync?.();
          return;
        }

        if (this.interactionMode === 'move') {
          this.moveSelectedItems(selectedItems, realDelta);
          this.lastRealPoint = realPoint;
          this.onLiveSync?.();
          return;
        }
      }

      if (this.dragItem) {
        if (selectedItems.length > 0) {
          this.moveSelectedItems(selectedItems, realDelta);
        }
      } else if (this.selectStartPoint) {
        if (this.selectionRect) this.selectionRect.remove();
        this.selectionRect = new this.scope.Path.Rectangle(this.selectStartPoint, realPoint);
        this.selectionRect.strokeColor = new this.scope.Color('#4483ff');
        this.selectionRect.strokeWidth = 1;
        this.selectionRect.dashArray = [5, 5];
        this.selectionRect.fillColor = new this.scope.Color(68 / 255, 131 / 255, 255 / 255, 0.1);
        (this.selectionRect as IPaintItem).guide = true;
      }

      this.lastRealPoint = realPoint;
    };

    this.tool.onMouseUp = () => {
      if (this.selectionRect) {
        const selBounds = this.selectionRect.bounds;
        this.drawingLayer.children.forEach((item) => {
          if (item.locked || (item as IPaintItem).guide || item.name === 'bounding-box') {
            return;
          }
          const itemBounds = item.bounds;
          if (itemBounds.intersects(selBounds) || item.isInside(selBounds)) {
            item.selected = true;
          }
        });
        this.selectionRect.remove();
        this.selectionRect = null;
      }

      // Sempre atualiza a bounding box ao soltar (re-mostra se estava escondida no giro)
      this.updateBoundingBox();

      this.selectStartPoint = null;
      this.interactionMode = null;

      if (this.hasMoved) {
        this.saveHistory();
        this.hasMoved = false;
      }
    };

    this.tool.onKeyDown = (event: paper.KeyEvent) => {
      if (event.key === 'delete' || event.key === 'backspace') {
        const selectedItems = this.getSelectedItems();
        if (selectedItems.length > 0) {
          selectedItems.forEach((item) => item.remove());
          this.updateBoundingBox();
          this.saveHistory();
        }
      }
    };
  }

  private moveSelectedItems(selectedItems: paper.Item[], delta: paper.Point) {
    let totalBounds: paper.Rectangle | null = null;
    selectedItems.forEach((item) => {
      if (!totalBounds) totalBounds = item.bounds.clone();
      else totalBounds = totalBounds.unite(item.bounds);
    });

    if (totalBounds) {
      const b = totalBounds as paper.Rectangle;
      const newBounds = b.clone();
      newBounds.x += delta.x;
      newBounds.y += delta.y;

      if (newBounds.left < 0) delta.x -= newBounds.left;
      if (newBounds.right > DRAWING_CONFIG.canvas.w) delta.x -= newBounds.right - DRAWING_CONFIG.canvas.w;
      if (newBounds.top < 0) delta.y -= newBounds.top;
      if (newBounds.bottom > DRAWING_CONFIG.canvas.h) delta.y -= newBounds.bottom - DRAWING_CONFIG.canvas.h;

      if (delta.length > 0) {
        selectedItems.forEach((item) => {
          item.position = item.position.add(delta);
        });
        this.hasMoved = true;
        this.updateBoundingBox();
      }
    }
  }

  private clearSelection() {
    this.drawingLayer.children.forEach((item) => {
      if (item.name !== 'bounding-box') {
        item.selected = false;
      }
    });
    this.updateBoundingBox();
  }

  // ── Highlight Layer ─────────────────────────────────────────────────────

  private getHighlightLayer(): paper.Layer {
    if (this.highlightLayer && this.highlightLayer.parent) {
      return this.highlightLayer;
    }
    let hl = this.scope.project.layers.find((l) => l.name === 'highlight');
    if (!hl) {
      hl = new this.scope.Layer({ name: 'highlight' });
    }
    hl.bringToFront();
    this.highlightLayer = hl;
    return hl;
  }

  /**
   * Recria os clones de highlight a cada update para garantir que a posição/forma
   * seja sempre sincronizada com o item original (funciona mesmo após mover/escalar/rotacionar).
   */
  private syncHighlightClones(selectedItems: paper.Item[]) {
    const hl = this.getHighlightLayer();
    const selectedIds = new Set(selectedItems.map((i) => i.id));

    // Remove clones de itens que não estão mais selecionados
    this.highlightClones.forEach((clone, id) => {
      if (!selectedIds.has(id)) {
        clone.remove();
        this.highlightClones.delete(id);
      }
    });

    // Reutiliza um clone fresco para cada item selecionado (Evita clonagem profunda a 60fps)
    selectedItems.forEach((item) => {
      let clone = this.highlightClones.get(item.id);

      // Cria apenas se não existir nesta seleção
      if (!clone) {
        // Clona em profundidade sem inserir na cena
        clone = item.clone({ insert: false, deep: true });

        // Insere na highlight layer e registra
        hl.addChild(clone);
        this.highlightClones.set(item.id, clone);

        // Aplica o estilo visual: stroke azul + fill transparente + sombra
        this.applyHighlightStyle(clone);
      }

      // Apenas atualiza a transformação a cada frame de movimento
      // Reseta a matrix local do clone para identidade
      clone.matrix.reset();

      // Aplica a globalMatrix do item original — captura posição/escala/rotação absolutas
      clone.transform(item.globalMatrix);
    });
  }

  /**
   * Estilo de highlight:
   * - fill completamente transparente (rgba 0) — nunca null — o original fica visível
   * - stroke azul como contorno
   * - sombra/glow azul suave
   */
  private applyHighlightStyle(item: paper.Item) {
    if (item instanceof this.scope.Group) {
      item.children.forEach((child) => this.applyHighlightStyle(child));
      return;
    }
    item.fillColor = new this.scope.Color(0, 0, 0, 0);
    item.strokeColor = new this.scope.Color('#0096FF');
    item.strokeWidth = 2;
    const paintItem = item as IPaintItem;
    paintItem.shadowColor = new this.scope.Color(0, 0.588, 1, 0.35);
    paintItem.shadowBlur = 4;
    paintItem.shadowOffset = new this.scope.Point(0, 0);
  }

  /**
   * Remove todos os clones de highlight (ao deselecionar ou trocar de ferramenta).
   */
  private clearHighlightClones() {
    this.highlightClones.forEach((clone) => clone.remove());
    this.highlightClones.clear();
  }

  // ── Bounding Box ────────────────────────────────────────────────────────

  private updateBoundingBox() {
    if (!this.scope.project) return;
    if (!this.caixaDelimitadora) {
      try {
        this.caixaDelimitadora = new BoundingBox(this.scope);
      } catch {
        return;
      }
    }
    const selectedItems = this.getSelectedItems();

    // Oculta o indicador padrão de seleção do Paper.js (usamos nosso próprio)
    selectedItems.forEach((item) => {
      (item as IPaintItem).selectedColor = new this.scope.Color(0, 0, 0, 0.0001);
    });

    // Sincroniza clones de highlight
    this.syncHighlightClones(selectedItems);

    // Simplificação: Voltamos ao Bounding Box reto (Axis-Aligned)
    // O usuário prefere que durante o giro apenas o contorno "brilhe"
    this.caixaDelimitadora.atualizar(selectedItems);
  }

  private getSelectableUnit(item: paper.Item): paper.Item {
    let current = item;
    let topMostStandardGroup: paper.Item | null = null;
    let directChildOfLayer: paper.Item = item;

    while (current && current.parent && current !== this.drawingLayer) {
      if (current instanceof this.scope.Group && current.name && SVG_ID_WHITELIST.includes(current.name)) {
        topMostStandardGroup = current;
      }
      if (current.parent === this.drawingLayer) {
        directChildOfLayer = current;
      }
      current = current.parent;
    }

    return topMostStandardGroup || directChildOfLayer;
  }

  private getSelectedItems() {
    return this.drawingLayer.children.filter((i) => i.selected && !i.locked && !(i as IPaintItem).guide && i.name !== 'bounding-box');
  }

  activate() {
    super.activate();
    this.updateBoundingBox();
  }

  onProjectChange() {
    this.clearHighlightClones();
    this.updateBoundingBox();
  }

  deactivate() {
    if (this.caixaDelimitadora) {
      this.caixaDelimitadora.esconder();
    }
    this.clearHighlightClones();
  }
}
