import type * as paper from 'paper';

import { BaseTool } from '../BaseTool';

export class CircleTool extends BaseTool {
    private currentCircle: paper.Path.Ellipse | null = null;
    private startPoint: paper.Point | null = null;

    protected setupHandlers() {
        this.tool.onMouseDown = (event: paper.ToolEvent) => {
            this.startPoint = this.getRealPoint(event);
        };

        this.tool.onMouseDrag = (event: paper.ToolEvent) => {
            if (!this.startPoint) return;
            const realPoint = this.getRealPoint(event);
            if (this.currentCircle) this.currentCircle.remove();

            let p1 = this.startPoint.clone();
            let p2 = realPoint.clone();

            // Alt modifier: desenhar a partir do centro
            if (event.modifiers.alt) {
                const diff = p2.subtract(p1);
                p2 = p1.add(diff);
                p1 = p1.subtract(diff);
            }

            // Shift modifier: restringir a proporção 1:1 (círculo)
            if (event.modifiers.shift) {
                const diff = p2.subtract(p1);
                const size = Math.max(Math.abs(diff.x), Math.abs(diff.y));
                p2.x = p1.x + (diff.x < 0 ? -size : size);
                p2.y = p1.y + (diff.y < 0 ? -size : size);
            }

            this.currentCircle = new this.scope.Path.Ellipse(new this.scope.Rectangle(p1, p2));
            this.drawingLayer.addChild(this.currentCircle);
            this.currentCircle.fillColor = this.fillColor;
            this.currentCircle.strokeColor = this.strokeColor;
            this.currentCircle.strokeWidth = this.getState().strokeWidth;
        };

        this.tool.onMouseUp = () => {
            if (this.currentCircle) {
                this.saveHistory();
                this.currentCircle = null;
            }
            this.startPoint = null;
        };
    }
}
