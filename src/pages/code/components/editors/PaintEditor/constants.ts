// Configuração centralizada da área de desenho
export const DRAWING_CONFIG = {
    canvas: { w: 1024, h: 600 },
    artboard: { w: 480, h: 360 },
    padding: 32, // Espaço extra para permitir scroll além das bordas
    minItemSize: 3, // Pequeno o suficiente para flexibilidade
    maxItemSize: 500, // Limite máximo solicitado
    minZoom: 0.5, // Começa em 50% 
    maxZoom: 10.0, // Zoom máximo de detalhe
    maxScroll: 20.0, // Limite de deslocamento relativo
    get abX() { return (this.canvas.w - this.artboard.w) / 2; },
    get abY() { return (this.canvas.h - this.artboard.h) / 2; }
};

// IDs de grupos que devem ser preservados e tratados como unidade (Standardized SVGs)
export const SVG_ID_WHITELIST = [
    'head', 'body', 'tail', 'arm', 'leg', 'foot', 'eye', 'mouth',
    'arm_l', 'arm_r', 'leg_l', 'leg_r', 'eye_l', 'eye_r',
    'face', 'tummy', 'detail', 'wing', 'neck', 'backpack'
];
