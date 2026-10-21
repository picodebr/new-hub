/**
 * TextTool - Inserção de texto vetorial.
 *
 * Responsabilidade: Criar objetos de texto (PointText) no projeto.
 * Dispara o input flutuante no CanvasView para captura da string pelo usuário.
 */
import { BaseTool, ToolState } from './BaseTool';

export class TextTool extends BaseTool {
  constructor(
    scope: paper.PaperScope,
    getState: () => ToolState,
    saveHistory: () => void,
    private onShowInput: (point: paper.Point) => void,
  ) {
    super(scope, getState, saveHistory);
  }

  protected setupHandlers() {
    this.tool.onMouseDown = (event: paper.ToolEvent) => {
      // No Paper.js, apenas enviamos o ponto para o React abrir o input
      this.onShowInput(this.getRealPoint(event));
    };
  }

  /**
   * Chamado pelo React quando o usuário termina de digitar
   */
  commitText(text: string, point: paper.Point) {
    if (!text.trim()) return;

    const state = this.getState();
    const textItem = new this.scope.PointText(point);
    this.drawingLayer.addChild(textItem);
    textItem.content = text;
    textItem.fillColor = this.fillColor || new this.scope.Color('black');
    textItem.fontSize = state.fontSize;
    textItem.fontFamily = state.fontFamily;

    this.saveHistory();
  }
}
