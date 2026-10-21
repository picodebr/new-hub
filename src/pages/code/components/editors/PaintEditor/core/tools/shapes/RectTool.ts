import type * as paper from 'paper';

import { BaseTool } from '../BaseTool';

export class RectTool extends BaseTool {
    private currentRect: paper.Path.Rectangle | null = null;
    private startPoint: paper.Point | null = null;

    protected setupHandlers() {
        this.tool.onMouseDown = (event: paper.ToolEvent) => {
            this.startPoint = this.getRealPoint(event);
        };

        this.tool.onMouseDrag = (event: paper.ToolEvent) => {
            if (!this.startPoint) return;
            const realPoint = this.getRealPoint(event);
            if (this.currentRect) this.currentRect.remove();

            let p1 = this.startPoint.clone();
            let p2 = realPoint.clone();

            // Alt modifier: desenhar a partir do centro
            if (event.modifiers.alt) {
                const diff = p2.subtract(p1);
                p2 = p1.add(diff);
                p1 = p1.subtract(diff);
            }

            // Shift modifier: restringir a proporção 1:1 (quadrado)
            if (event.modifiers.shift) {
                const diff = p2.subtract(p1);
                const size = Math.max(Math.abs(diff.x), Math.abs(diff.y));
                p2.x = p1.x + (diff.x < 0 ? -size : size);
                p2.y = p1.y + (diff.y < 0 ? -size : size);
            }

            this.currentRect = new this.scope.Path.Rectangle(p1, p2);
            this.drawingLayer.addChild(this.currentRect);
            this.currentRect.fillColor = this.fillColor;
            this.currentRect.strokeColor = this.strokeColor;
            this.currentRect.strokeWidth = this.getState().strokeWidth;
        };

        this.tool.onMouseUp = () => {
            if (this.currentRect) {
                this.saveHistory();
                this.currentRect = null;
            }
            this.startPoint = null;
        };
    }
}
