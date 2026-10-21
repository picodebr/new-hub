/**
 * IProject - Definições de Tipos para o Projeto e Eventos Globais.
 * 
 * Este arquivo define os eventos que o ProjectService emite para sinalizar 
 * mudanças globais, como alteração na lista de atores ou troca do ator ativo.
 */
import { SpriteData } from './ISprite';
import { BackdropData } from './IBackdrop';

export interface ProjectEvents {
    spritesChange: SpriteData[];
    backdropChange: BackdropData[];
    activeSpriteChange: string;
    activeBackdropChange: string;
}
