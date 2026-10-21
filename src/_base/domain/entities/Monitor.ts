/**
 * MonitorData - Definição do estado de um Monitor de Palco.
 * 
 * Monitores são os displays flutuantes que mostram valores de variáveis,
 * listas ou sensores (direção, x, y, resposta, etc.) no palco.
 */
export interface MonitorData {
    id: string;          // Identificador único (geralmente tipo_spriteId_params)
    spriteId: string;    // ID do ator ao qual o monitor pertence (ou 'stage' para globais)
    type: 'variable' | 'sensing' | 'ml' | 'list';
    label: string;       // Texto exibido no monitor (ex: "Sprite1: direção")
    value: string | number; // Valor atual exibido (para variáveis/sensores escalares)
    items?: (string | number)[]; // Itens da lista (apenas quando type === 'list')
    visible: boolean;    // Se o monitor deve estar visível no palco
    x: number;           // Posição X no palco (pixels)
    y: number;           // Posição Y no palco (pixels)
    width?: number;      // Largura do monitor de lista (px)
    height?: number;     // Altura do monitor de lista (px)
    color?: string;      // Cor opcional para o header (ex: laranja para listas)
}
