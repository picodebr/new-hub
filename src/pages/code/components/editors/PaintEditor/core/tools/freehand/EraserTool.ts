import { BaseTool } from '../BaseTool';
import { IPaintItem } from '@/_base/domain/entities/IPaintEditor';

export class EraserTool extends BaseTool {
  private lastCursorSize: number = 0;
  private cursorUrl: string | null = null;

  private updateCursorPattern() {
    if (!this.scope.view || !this.scope.view.element) return;

    const size = this.getState().brushSize;
    const zoom = this.scope.view.zoom;
    const canvasSize = Math.max(4, Math.round(size * zoom));

    if (this.lastCursorSize === canvasSize) return;
    this.lastCursorSize = canvasSize;

    if (this.cursorUrl) {
      URL.revokeObjectURL(this.cursorUrl);
    }

    const r = canvasSize / 2 - 0.5;
    const c = canvasSize / 2;

    const svg = `<svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${c}" cy="${c}" r="${r > 0 ? r : 1}" fill="rgba(80,80,80,0.15)" stroke="rgba(0,0,0,0.8)" stroke-width="1.5" />
            <circle cx="${c}" cy="${c}" r="${r > 0 ? r : 1}" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="0.5" />
        </svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    this.cursorUrl = URL.createObjectURL(blob);

    this.scope.view.element.style.setProperty('cursor', `url(${this.cursorUrl}) ${c} ${c}, crosshair`, 'important');
  }

  protected setupHandlers() {
    this.tool.onMouseMove = () => {
      this.updateCursorPattern();
    };

    this.tool.onMouseDown = (event: paper.ToolEvent) => {
      const realPoint = this.getRealPoint(event);
      this.updateCursorPattern();
      this.eraseAt(realPoint);
    };

    this.tool.onMouseDrag = (event: paper.ToolEvent) => {
      const realPoint = this.getRealPoint(event);
      this.eraseAt(realPoint);
    };

    this.tool.onMouseUp = () => {
      this.saveHistory();
    };
  }

  private eraseAt(point: paper.Point) {
    const size = this.getState().brushSize;
    const dl = this.drawingLayer;

    const mathCircle = new this.scope.Path.Circle({
      center: point,
      radius: size / 2,
      insert: true,
      parent: dl,
      visible: false,
    }) as IPaintItem;
    mathCircle.guide = true;

    try {
      const children = [...dl.children];

      const recursiveErase = (item: IPaintItem) => {
        if (!item || item.guide || item === mathCircle) return;
        if (item.locked) return;

        if (item instanceof this.scope.Group) {
          const groupChildren = [...item.children];
          groupChildren.forEach((child) => recursiveErase(child));

          if (item.children.length === 0) item.remove();
        } else if (item instanceof this.scope.PathItem) {
          if (item.bounds.intersects(mathCircle.bounds) || mathCircle.isInside(item.bounds)) {
            try {
              const result = item.subtract(mathCircle as unknown as paper.PathItem, { insert: false });

              if (result) {
                if (result instanceof this.scope.Path && result.segments.length === 0) {
                  item.remove();
                } else if (result.bounds.width === 0 || result.bounds.height === 0) {
                  item.remove();
                } else if (result !== item) {
                  item.replaceWith(result);
                  result.selected = item.selected;
                }
              } else {
                item.remove();
              }
            } catch (err) {
              console.warn('Falha matemática no Paper.js:', err);
            }
          }
        }
      };

      children.forEach((item) => recursiveErase(item));
    } finally {
      mathCircle.remove();
    }
  }

  activate() {
    super.activate();
    this.lastCursorSize = 0;
    this.updateCursorPattern();
  }

  deactivate() {
    if (this.scope.view && this.scope.view.element) {
      this.scope.view.element.style.setProperty('cursor', 'crosshair', 'important');
    }
    if (this.cursorUrl) {
      URL.revokeObjectURL(this.cursorUrl);
      this.cursorUrl = null;
    }
    this.lastCursorSize = 0;
  }
}
