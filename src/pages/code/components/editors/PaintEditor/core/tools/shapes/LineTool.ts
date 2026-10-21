import type * as paper from 'paper';

import { BaseTool } from '../BaseTool';

export class LineTool extends BaseTool {
    private currentLine: paper.Path.Line | null = null;
    private startPoint: paper.Point | null = null;

    protected setupHandlers() {
        this.tool.onMouseDown = (event: paper.ToolEvent) => {
            this.startPoint = this.getRealPoint(event);
        };

        this.tool.onMouseDrag = (event: paper.ToolEvent) => {
            if (!this.startPoint) return;
            const realPoint = this.getRealPoint(event);
            if (this.currentLine) this.currentLine.remove();

            let p1 = this.startPoint.clone();
            let p2 = realPoint.clone();

            // Alt modifier: desenhar a partir do centro
            if (event.modifiers.alt) {
                const diff = p2.subtract(p1);
                p2 = p1.add(diff);
                p1 = p1.subtract(diff);
            }

            // Shift modifier: travar em ângulos de 45 graus
            if (event.modifiers.shift) {
                const diff = p2.subtract(p1);
                const angle = Math.round(diff.angle / 45) * 45;
                const length = diff.length;
                p2 = p1.add(new this.scope.Point({ angle: angle, length: length }));
            }

            this.currentLine = new this.scope.Path.Line(p1, p2);
            this.drawingLayer.addChild(this.currentLine);
            this.currentLine.strokeColor = this.strokeColor;
            this.currentLine.strokeWidth = this.getState().strokeWidth;
            this.currentLine.strokeCap = 'round';
        };

        this.tool.onMouseUp = () => {
            if (this.currentLine) {
                this.saveHistory();
                this.currentLine = null;
            }
            this.startPoint = null;
        };
    }
}
