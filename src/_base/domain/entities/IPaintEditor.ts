import type * as paper from 'paper';


/**
 * Interface estendida para itens do Paper.js no Editor de Pintura.
 * Adiciona propriedades customizadas usadas pelo projeto.
 */
export interface IPaintItem extends paper.Item {
  guide?: boolean;
  _canvasDirty?: boolean;
}

export interface IPaintExportOptions {
  asString?: boolean;
  precision?: number;
  match?: (item: paper.Item) => boolean;
  embedImages?: boolean;
}

/**
 * Interface para eventos de ferramenta do Paper.js com acesso ao evento nativo.
 */
export interface IPaperEvent extends paper.ToolEvent {
  event: MouseEvent | TouchEvent;
}

/**
 * Interface para opções de hit test do Paper.js.
 * Definida manualmente para evitar dependência de membros não exportados do namespace 'paper'.
 */
export interface IPaintHitOptions {
  segments?: boolean;
  stroke?: boolean;
  fill?: boolean;
  tolerance?: number;
  ends?: boolean;
  bounds?: boolean;
  center?: boolean;
  guides?: boolean;
  selected?: boolean;
  /** Algumas versões do Paper.js usam 'match', outras 'matches'. */
  match?: (hit: paper.HitResult) => boolean;
  matches?: (hit: paper.HitResult) => boolean;
}

/**
 * Interface estendida para o objeto window com callbacks do editor de pintura.
 */
export interface IPaintWindow extends Window {
  __p_setFillColor?: (color: string) => void;
  __p_setStrokeColor?: (color: string) => void;
}

/**
 * Interface para representar o estado das ferramentas de pintura (cores, larguras, etc).
 */
export interface PaintState {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  brushSize: number;
  fillTransparent: boolean;
  strokeTransparent: boolean;
  tool: string;
  zoom: number;
  textValue: string;
  fontFamily: string;
  fontSize: number;
}
