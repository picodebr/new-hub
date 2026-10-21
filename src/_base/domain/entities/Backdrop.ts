/**
 * BackdropData - Representação de cenários do palco.
 *
 * Responsabilidade: Definir a estrutura de dados para o fundo do palco,
 * permitindo a troca dinâmica de ambientes e skins durante a execução.
 */
import { SoundData } from './Sprite';

export interface BackdropData {
    id: string;
    name: string;
    url: string;       // thumbnail cropado (sidebar)
    stageUrl?: string; // SVG 480×360 para renderização no palco
    sounds: SoundData[];
    currentSoundId: string | null;
}
