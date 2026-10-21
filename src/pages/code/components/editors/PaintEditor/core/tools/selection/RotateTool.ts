import type * as paper from 'paper';


export class RotateTool {
  private hasMoved = false;
  private lastAngle: number = 0;
  private pivotCenter: paper.Point | null = null;

  constructor(
    private scope: paper.PaperScope,
    private saveHistory: () => void,
    private updateBoundingBox: () => void,
    private hideBoundingBox: () => void,
    private rotateClone: (id: number, angle: number, origin: paper.Point) => void
  ) {}

  onMouseDown(event: paper.ToolEvent, boundingBoxBounds: paper.Rectangle, currentRealPoint: paper.Point) {
    this.hasMoved = false;
    this.pivotCenter = boundingBoxBounds.center;
    this.lastAngle = currentRealPoint.subtract(this.pivotCenter).angle;
  }

  onMouseDrag(event: paper.ToolEvent, selectedItems: paper.Item[], boundingBoxBounds: paper.Rectangle, currentRealPoint: paper.Point) {
    if (selectedItems.length === 0 || !this.pivotCenter) return;

    const currentAngle = currentRealPoint.subtract(this.pivotCenter).angle;
    let deltaAngle = currentAngle - this.lastAngle;

    if (event.modifiers.shift) {
      // Logic for snapping could be implemented here if needed.
    }

    selectedItems.forEach((item) => {
      item.rotate(deltaAngle, this.pivotCenter!);
      this.rotateClone(item.id, deltaAngle, this.pivotCenter!);
    });
    
    this.lastAngle = currentAngle;
    this.hasMoved = true;

    this.hideBoundingBox();
  }

  onMouseUp(event: paper.ToolEvent) {
    if (this.hasMoved) {
      this.updateBoundingBox(); // Sync BoundingBox real
      this.saveHistory();
      this.hasMoved = false;
    }
  }
}
