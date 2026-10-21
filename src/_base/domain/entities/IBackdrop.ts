/**
 * IBackdrop - Definições de Tipos para Cenários (Backdrops).
 * 
 * Contém a interface que padroniza os dados de um cenário, incluindo 
 * identificador, nome exibível e a URL da imagem correspondente.
 */

export interface BackdropData {
    id: string;
    name: string;
    url: string;
}
