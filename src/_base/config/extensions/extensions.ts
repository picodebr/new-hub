export interface Extension {
    id: string;
    name: string;
    description: string;
    CardBannerUrl: string; // Banner de fundo
    badgeUrl: string; // Ícone pequeno
    requiresWIFI?: boolean;
    requiresBluetooth?: boolean;
    modes: ('stage' | 'upload')[]; // Modos onde esta extensão aparece
}

// ==========================================
// LISTA DE EXTENSÕES DISPONÍVEIS
// Adicione novas extensões copiando o modelo abaixo
// ==========================================
export const EXTENSIONS: Extension[] = [
    {
        id: 'ia',
        name: 'Vision Lab',
        description: 'Classificar imagens e detecção de objetos.',
        CardBannerUrl: '/img/ML_card.png',
        badgeUrl: '/svg/cerebro.svg',
        requiresWIFI: true,
        modes: ['stage' as const, 'upload' as const],
    },
    {
        id: 'piboard',
        name: 'PiBoard®',
        description: 'Use os blocos da placa em tempo real no palco.',
        CardBannerUrl: '/img/piboard_card.png',
        badgeUrl: '/svg/Piboard-icon.svg',
        modes: ['stage' as const],
    }, {
        id: 'artbot',
        name: 'ArtBot',
        description: 'Controlar o ArtBot',
        CardBannerUrl: '/img/artBot_card.jpeg',
        badgeUrl: '/svg/artBot_icon.svg',
        modes: ['upload' as const],
    },

    // 👇 Exemplo para criar a sua:
    /*
    {
        id: 'arduino',
        name: 'Arduino Maker',
        description: 'Conecte sua placa e controle motores.',
        CardBannerUrl: '/svg/arduino_ext.svg',
        badgeUrl: '/svg/arduino_icon.svg',
        requiresBluetooth: true
    },
    */
];
