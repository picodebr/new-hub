import { BaseTool } from '../BaseTool';
import { DRAWING_CONFIG, SVG_ID_WHITELIST } from '../../../constants';
import { IPaintItem, IPaintHitOptions, IPaintWindow } from '@/_base/domain/entities/IPaintEditor';
import { BoundingBox } from '../BoundingBox';
import { MoveTool } from './MoveTool';
import { ScaleTool } from './ScaleTool';
import { RotateTool } from './RotateTool';

export class SelectTool extends BaseTool {
  private caixaDelimitadora!: BoundingBox;
  private interactionMode: string | null = null;
  private selectStartPoint: paper.Point | null = null;
  private selectionRect: paper.Path | null = null;

  // Sub-tools
  private moveTool: MoveTool;
  private scaleTool: ScaleTool;
  private rotateTool: RotateTool;

  constructor(
    scope: paper.PaperScope,
    getState: () => any,
    saveHistory: () => void
  ) {
    super(scope, getState, saveHistory);
    this.moveTool = new MoveTool(
      this.scope,
      () => this.saveHistory(),
      () => this.updateBoundingBox(),
      (delta) => this.translateSelectionVisuals(delta)
    );
    this.scaleTool = new ScaleTool(
      this.scope,
      () => this.saveHistory(),
      () => this.updateBoundingBox(),
      (id, sx, sy, origin) => this.scaleClone(id, sx, sy, origin),
      () => { if (this.caixaDelimitadora) this.caixaDelimitadora.atualizar(this.getSelectedItems()); }
    );
    this.rotateTool = new RotateTool(
      this.scope,
      () => this.saveHistory(),
      () => this.updateBoundingBox(),
      () => { if (this.caixaDelimitadora) this.caixaDelimitadora.esconder(); },
      (id, angle, origin) => this.rotateClone(id, angle, origin)
    );
  }

  // Clones de highlight (contorno azul + sombra) na highlightLayer
  private highlightClones: Map<number, paper.Item> = new Map();
  private highlightLayer: paper.Layer | null = null;

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

      const realPoint = this.getRealPoint(event);
      this.lastRealPoint = realPoint;

      // 1. Hit-Test nas alças
      const handleHit = this.caixaDelimitadora.testarColisaoAlcas(realPoint);
      if (handleHit) {
        this.interactionMode = handleHit;
        const selectedItems = this.getSelectedItems();

        if (selectedItems.length > 0) {
          if (this.interactionMode === 'rotate') {
            this.rotateTool.onMouseDown(event, this.caixaDelimitadora.obterLimites(), realPoint);
          } else if (this.interactionMode.startsWith('scale-')) {
            this.scaleTool.onMouseDown(event, this.interactionMode, this.caixaDelimitadora.obterLimites());
          }
        }
        return;
      }

      // 2. Hit test no projeto
      const currentZoom = this.scope.view.zoom;
      const dynamicTolerance = 5 / currentZoom;
      const currentHitOptions = { ...this.hitOptions, tolerance: dynamicTolerance };

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
          this.interactionMode = 'move';
          this.moveTool.onMouseDown(event, hitResult);

          const win = window as unknown as IPaintWindow;
          if (item.fillColor) win.__p_setFillColor?.(item.fillColor.toCSS(true));
          if (item.strokeColor) win.__p_setStrokeColor?.(item.strokeColor.toCSS(true));
        } else {
          this.interactionMode = null;
        }
      } else {
        // 3. Clicou dentro da área de seleção
        if (this.caixaDelimitadora.testarColisaoCaixa(realPoint)) {
          this.interactionMode = 'move';
          this.moveTool.onMouseDown(event, null);
        } else {
          // 4. Fora — inicia seleção por arrastar ou limpa
          if (!event.modifiers.shift) {
            this.clearSelection();
          }
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
          this.rotateTool.onMouseDrag(event, selectedItems, this.caixaDelimitadora.obterLimites(), realPoint);
        } else if (this.interactionMode.startsWith('scale-')) {
          this.scaleTool.onMouseDrag(event, selectedItems, this.lastRealPoint!, realPoint);
        } else if (this.interactionMode === 'move') {
          this.moveTool.onMouseDrag(event, selectedItems, event.delta);
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

    this.tool.onMouseUp = (event: paper.ToolEvent) => {
      const selectedItems = this.getSelectedItems();
      if (this.selectionRect) {
        const selBounds = this.selectionRect.bounds;
        this.drawingLayer.children.forEach((item) => {
          if (item.locked || (item as IPaintItem).guide || item.name === 'bounding-box') return;
          if (item.bounds.intersects(selBounds) || item.isInside(selBounds)) {
            item.selected = true;
          }
        });
        this.selectionRect.remove();
        this.selectionRect = null;
      }

      if (this.interactionMode === 'rotate') this.rotateTool.onMouseUp(event);
      else if (this.interactionMode?.startsWith('scale-')) this.scaleTool.onMouseUp(event);
      else if (this.interactionMode === 'move') this.moveTool.onMouseUp(event);

      this.updateBoundingBox();
      this.selectStartPoint = null;
      this.interactionMode = null;
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

  private translateSelectionVisuals(delta: paper.Point) {
    if (this.caixaDelimitadora) {
      this.caixaDelimitadora.traduzir(delta);
    }
    this.highlightClones.forEach((clone) => {
      clone.position = clone.position.add(delta);
    });
  }

  private scaleClone(id: number, sx: number, sy: number, origin: paper.Point) {
    const clone = this.highlightClones.get(id);
    if (clone) clone.scale(sx, sy, origin);
  }

  private rotateClone(id: number, angle: number, origin: paper.Point) {
    const clone = this.highlightClones.get(id);
    if (clone) clone.rotate(angle, origin);
  }

  private clearSelection() {
    this.drawingLayer.children.forEach((item) => {
      if (item.name !== 'bounding-box') item.selected = false;
    });
    this.updateBoundingBox();
  }

  private getHighlightLayer(): paper.Layer {
    let hl = this.scope.project.layers.find((l) => l.name === 'ui');
    if (!hl) hl = new this.scope.Layer({ name: 'ui' });
    hl.bringToFront();
    return hl;
  }

  private syncHighlightClones(selectedItems: paper.Item[]) {
    const hl = this.getHighlightLayer();
    const selectedIds = new Set(selectedItems.map((i) => i.id));

    this.highlightClones.forEach((clone, id) => {
      if (!selectedIds.has(id)) {
        clone.remove();
        this.highlightClones.delete(id);
      }
    });

    selectedItems.forEach((item) => {
      let clone = this.highlightClones.get(item.id);
      if (!clone) {
        clone = item.clone({ insert: false, deep: true });
        hl.addChild(clone);
        this.highlightClones.set(item.id, clone);
        this.applyHighlightStyle(clone);
      }
      clone.matrix.reset();
      clone.transform(item.globalMatrix);
    });
  }

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

  private clearHighlightClones() {
    this.highlightClones.forEach((clone) => clone.remove());
    this.highlightClones.clear();
  }

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

    selectedItems.forEach((item) => {
      (item as IPaintItem).selectedColor = new this.scope.Color(0, 0, 0, 0.0001);
    });

    this.syncHighlightClones(selectedItems);
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
    // Após undo/redo o project.clear() orphana o grupo do BoundingBox (sem parent layer).
    // Destruímos o objeto antigo para que updateBoundingBox crie um novo na 'ui' layer recriada.
    if ((this as any).caixaDelimitadora) {
      try { (this as any).caixaDelimitadora.remover(); } catch {}
      (this as any).caixaDelimitadora = null;
    }
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
