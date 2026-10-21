import type * as paper from 'paper';

import { DRAWING_CONFIG } from '../../../constants';

export class MoveTool {
  private hasMoved = false;

  constructor(
    private scope: paper.PaperScope,
    private saveHistory: () => void,
    private updateBoundingBox: () => void,
    private translateVisuals: (delta: paper.Point) => void
  ) {}

  onMouseDown(event: paper.ToolEvent, hitResult: paper.HitResult | null) {
    this.hasMoved = false;
  }

  onMouseDrag(event: paper.ToolEvent, selectedItems: paper.Item[], delta: paper.Point) {
    if (selectedItems.length === 0) return;

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

      // Restrição de limites (maxScroll)
      if (newBounds.left < -DRAWING_CONFIG.maxScroll) delta.x -= newBounds.left + DRAWING_CONFIG.maxScroll;
      if (newBounds.right > DRAWING_CONFIG.canvas.w + DRAWING_CONFIG.maxScroll) delta.x -= newBounds.right - (DRAWING_CONFIG.canvas.w + DRAWING_CONFIG.maxScroll);
      if (newBounds.top < -DRAWING_CONFIG.maxScroll) delta.y -= newBounds.top + DRAWING_CONFIG.maxScroll;
      if (newBounds.bottom > DRAWING_CONFIG.canvas.h + DRAWING_CONFIG.maxScroll) delta.y -= newBounds.bottom - (DRAWING_CONFIG.canvas.h + DRAWING_CONFIG.maxScroll);

      if (delta.length > 0) {
        selectedItems.forEach((item) => {
          item.position = item.position.add(delta);
        });
        this.hasMoved = true;
        this.translateVisuals(delta);
      }
    }
  }

  onMouseUp(event: paper.ToolEvent) {
    if (this.hasMoved) {
      this.updateBoundingBox(); // Sync real bounds on release
      this.saveHistory();
      this.hasMoved = false;
    }
  }
}
