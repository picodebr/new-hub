import { BaseTool } from './BaseTool';
import { IPaintItem } from '@/_base/domain/entities/IPaintEditor';

export class SlicerTool extends BaseTool {
  private selectionRect: paper.Path | null = null;
  private startPoint: paper.Point | null = null;
  private targetRaster: paper.Raster | null = null;

  protected setupHandlers() {
    this.tool.onMouseDown = (event: paper.ToolEvent) => {
      const realPoint = this.getRealPoint(event);
      // 1. Find a Raster under the mouse or just the first selected one
      const hitResult = this.scope.project.hitTest(realPoint, {
        match: (hit: paper.HitResult) => hit.item instanceof this.scope.Raster && !hit.item.locked && !(hit.item as IPaintItem).guide,
      });

      if (hitResult) {
        this.targetRaster = hitResult.item as paper.Raster;
        this.startPoint = realPoint;
      } else {
        this.targetRaster = null;
        this.startPoint = null;
      }
    };

    this.tool.onMouseDrag = (event: paper.ToolEvent) => {
      if (!this.startPoint) return;
      const realPoint = this.getRealPoint(event);

      if (this.selectionRect) this.selectionRect.remove();
      this.selectionRect = new this.scope.Path.Rectangle(this.startPoint, realPoint);
      this.selectionRect.strokeColor = new this.scope.Color('#ff4444');
      this.selectionRect.strokeWidth = 1;
      this.selectionRect.dashArray = [4, 4];
      (this.selectionRect as IPaintItem).guide = true;
    };

    this.tool.onMouseUp = () => {
      if (!this.targetRaster || !this.selectionRect || !this.startPoint) {
        this.cleanup();
        return;
      }

      const selBounds = this.selectionRect.bounds;
      const rasterBounds = this.targetRaster.bounds;

      // Only proceed if there is an actual intersection
      const intersection = selBounds.intersect(rasterBounds);
      if (intersection.width > 0 && intersection.height > 0) {
        this.sliceRaster(this.targetRaster, intersection);
        this.saveHistory();
      }

      this.cleanup();
    };
  }

  private sliceRaster(raster: paper.Raster, area: paper.Rectangle) {
    // 1. Get the pixel data from the slice area
    // We need to convert from global coordinates to local Raster coordinates
    // localTopLeft was unused

    // Raster.getSubRaster returns a new Raster from a sub-rectangle
    // But we want to "cut" (divide).
    // Strategy:
    // a) Create subRaster
    // b) Clear the area in the parent Raster

    try {
      // getSubRaster handles the extraction and creates a new Raster item
      const subRaster = raster.getSubRaster(area);

      // For the "cut" effect (Scratch style), we clear the source area
      const ctx = raster.context;
      if (ctx) {
        ctx.save();
        const localArea = new this.scope.Rectangle(raster.globalToLocal(area.topLeft), raster.globalToLocal(area.bottomRight));

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.rect(localArea.x, localArea.y, localArea.width, localArea.height);
        ctx.fill();
        ctx.restore();

        (raster as IPaintItem)._canvasDirty = true;
      }

      // deselect parent, select child
      raster.selected = false;
      subRaster.selected = true;
    } catch (e) {
      console.error('Erro ao recortar imagem:', e);
    }
  }

  private cleanup() {
    if (this.selectionRect) {
      this.selectionRect.remove();
      this.selectionRect = null;
    }
    this.startPoint = null;
    this.targetRaster = null;
  }

  deactivate() {
    this.cleanup();
  }
}
