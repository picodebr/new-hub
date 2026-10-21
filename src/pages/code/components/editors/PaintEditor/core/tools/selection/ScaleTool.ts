import type * as paper from 'paper';

import { DRAWING_CONFIG } from '../../../constants';

export class ScaleTool {
  private hasMoved = false;
  private transformOrigin: paper.Point | null = null;
  private handleTarget: string = '';

  constructor(
    private scope: paper.PaperScope,
    private saveHistory: () => void,
    private updateBoundingBox: () => void,
    private scaleClone: (id: number, sx: number, sy: number, origin: paper.Point) => void,
    private updateBoundingBoxVisuals: () => void
  ) {}

  onMouseDown(event: paper.ToolEvent, interactionMode: string, boundingBoxBounds: paper.Rectangle) {
    this.hasMoved = false;
    this.handleTarget = interactionMode.split('-')[1];

    const b = boundingBoxBounds;
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
    this.transformOrigin = oppMap[this.handleTarget];
  }

  onMouseDrag(event: paper.ToolEvent, selectedItems: paper.Item[], lastRealPoint: paper.Point, currentRealPoint: paper.Point) {
    if (selectedItems.length === 0 || !this.transformOrigin) return;

    const origin = this.transformOrigin;
    const lastVec = lastRealPoint.subtract(origin);
    const curVec = currentRealPoint.subtract(origin);

    let sx = 1, sy = 1;
    if (['tl', 'tr', 'bl', 'br', 'lc', 'rc'].includes(this.handleTarget)) {
      if (Math.abs(lastVec.x) > 0.01) sx = curVec.x / lastVec.x;
    }
    if (['tl', 'tr', 'bl', 'br', 'tc', 'bc'].includes(this.handleTarget)) {
      if (Math.abs(lastVec.y) > 0.01) sy = curVec.y / lastVec.y;
    }

    if (!isFinite(sx) || sx === 0) sx = 1;
    if (!isFinite(sy) || sy === 0) sy = 1;

    if (event.modifiers.shift && ['tl', 'tr', 'bl', 'br'].includes(this.handleTarget)) {
      const maxS = Math.max(Math.abs(sx), Math.abs(sy));
      sx = sx < 0 ? -maxS : maxS;
      sy = sy < 0 ? -maxS : maxS;
    }

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

    selectedItems.forEach((item) => {
      item.scale(sx, sy, origin);
      this.scaleClone(item.id, sx, sy, origin);
    });

    this.hasMoved = true;
    this.updateBoundingBoxVisuals();
  }

  onMouseUp(event: paper.ToolEvent) {
    if (this.hasMoved) {
      this.updateBoundingBox(); // Update bounding box real after scale finishes
      this.saveHistory();
      this.hasMoved = false;
    }
  }
}
