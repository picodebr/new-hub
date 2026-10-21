/**
 * BaseTool - Classe abstrata fundamentadora para todas as ferramentas de desenho.
 *
 * Responsabilidade: Padronizar o ciclo de vida das ferramentas (Active/Deactive),
 * prover acesso rápido às camadas do projeto e, crucialmente, resolver o
 * mapeamento de coordenadas entre o Mouse (Viewport) e o Canvas (Project Space),
 * garantindo precisão milimétrica mesmo com Zoom e Telas Retina.
 */
import { IPaperEvent } from '@/_base/domain/entities/IPaintEditor';
import type * as paper from 'paper';


export interface ToolState {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  brushSize: number;
  fillTransparent: boolean;
  fontFamily: string;
  fontSize: number;
}

export abstract class BaseTool {
  protected tool: paper.Tool;

  constructor(
    protected scope: paper.PaperScope,
    protected getState: () => ToolState,
    protected saveHistory: () => void
  ) {
    this.tool = new this.scope.Tool();
    this.setupHandlers();
  }

  protected abstract setupHandlers(): void;

  activate() {
    this.tool.activate();
    if (this.scope.view && this.scope.view.element) {
      this.scope.view.element.style.cursor = 'crosshair';
    }
  }

  deactivate() {
    // To be overridden by subclasses if needed
  }

  /**
   * Called when the project state has changed from outside the tool
   * (e.g. from the UI header).
   */
  onProjectChange() {
    // To be overridden by subclasses
  }

  protected get drawingLayer(): paper.Layer {
    return this.scope.project.layers.find((l) => l.name === 'drawing') || this.scope.project.activeLayer;
  }

  protected get guideLayer(): paper.Layer {
    return this.scope.project.layers.find((l) => l.name === 'guides')!;
  }

  protected get fillColor(): paper.Color | null {
    const state = this.getState();
    return state.fillTransparent ? null : new this.scope.Color(state.fillColor);
  }

  protected get strokeColor(): paper.Color {
    return new this.scope.Color(this.getState().strokeColor);
  }

  /**
   * Resgata o evento nativo e calcula a coordenada correta considerando o HiDPI (Retina).
   * O event.point do Paper.js falha quando hidpi está ativo e o canvas é redimensionado via CSS.
   */
  protected getRealPoint(event: paper.ToolEvent): paper.Point {
    const canvas = this.scope.view.element;
    const rect = canvas.getBoundingClientRect();

    // Extrai o evento real do DOM
    const nativeEvent = (event as IPaperEvent).event;

    let clientX = 0;
    let clientY = 0;

    if (nativeEvent instanceof MouseEvent) {
      clientX = nativeEvent.clientX;
      clientY = nativeEvent.clientY;
    } else if (typeof TouchEvent !== 'undefined' && nativeEvent instanceof TouchEvent) {
      if (nativeEvent.touches && nativeEvent.touches.length > 0) {
        clientX = nativeEvent.touches[0].clientX;
        clientY = nativeEvent.touches[0].clientY;
      } else {
        return event.point; // Soltou a tela
      }
    } else {
      return event.point; // Evento desconhecido
    }

    // Posição CSS Exata relativa à borda superior esquerda do Canvas
    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;

    // O SEGREDO DO ALINHAMENTO PERFEITO:
    // Em vez de lutar contra as conversões nativas do Paper.js ou do devicePixelRatio,
    // garantimos que a proporção do clique no container CSS seja transferida
    // exatamente para a mesma proporção dentro do tamanho lógico da View do Paper.js.
    const scaleX = this.scope.view.viewSize.width / rect.width;
    const scaleY = this.scope.view.viewSize.height / rect.height;

    const viewX = cssX * scaleX;
    const viewY = cssY * scaleY;

    // Agora convertemos esse ponto lógico da View para a escala do Projeto (levando o Zoom em conta)
    return this.scope.view.viewToProject(new this.scope.Point(viewX, viewY));
  }
  /**
   * Get the current zoom level of the view.
   */
  protected get currentZoom(): number {
    return this.scope.view.zoom;
  }

  /**
   * Get the current center of the view in project coordinates.
   */
  protected get viewCenter(): paper.Point {
    return this.scope.view.center;
  }

  /**
   * Converts a size in screen pixels to project units.
   * Useful for keeping UI elements (like handles) a consistent size on screen.
   */
  protected toProjectSize(pixelSize: number): number {
    return pixelSize / this.currentZoom;
  }

  /**
   * Converts project units to screen pixels.
   */
  protected toScreenSize(projectSize: number): number {
    return projectSize * this.currentZoom;
  }

  /**
   * Converts a view point (canvas local pixels) to project coordinates.
   */
  protected viewToProject(viewPoint: paper.Point): paper.Point {
    return this.scope.view.viewToProject(viewPoint);
  }

  /**
   * Converts project coordinates to view points (canvas local pixels).
   */
  protected projectToView(projectPoint: paper.Point): paper.Point {
    return this.scope.view.projectToView(projectPoint);
  }
}
