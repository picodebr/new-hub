/**
 * LibraryService - Serviço de acesso a ativos externos (Personagens/Cenários).
 *
 * Responsabilidade: Gerenciar a busca e carregamento de recursos corporativos
 * da biblioteca oficial, abstraindo a origem dos dados (Mock JSON ou API real)
 * e permitindo extensibilidade futura.
 *
 * Operações Principais:
 * - getCharacters: Recuperação da lista de atores disponíveis.
 * - getBackdrops: Recuperação da lista de cenários disponíveis.
 */

import { LibrarySprite } from '@/_base/config/sprite_library';

export class LibraryService {
  private static instance: LibraryService;

  private constructor() {}

  public static getInstance(): LibraryService {
    if (!LibraryService.instance) {
      LibraryService.instance = new LibraryService();
    }
    return LibraryService.instance;
  }

  /**
   * Busca a lista de personagens disponíveis a partir da "API" (Mock JSON).
   * Esta estrutura facilita a migração futura para um Banco de Dados real e S3.
   */
  public async getCharacters(): Promise<LibrarySprite[]> {
    try {
      // Simula latência de rede
      await new Promise((resolve) => setTimeout(resolve, 400));

      // MOCK: Para usar um banco de dados real, basta trocar esta URL pelo seu endpoint de API
      const response = await fetch('/mock_api/characters.json');
      if (!response.ok) {
        throw new Error('Erro ao buscar biblioteca de personagens');
      }
      return await response.json();
    } catch (error) {
      console.error('[LibraryService] Falha ao buscar personagens:', error);
      return [];
    }
  }
  /**
   * Busca a lista de cenários disponíveis a partir da "API" (Mock JSON).
   */
  public async getBackdrops(): Promise<LibrarySprite[]> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const response = await fetch('/mock_api/backdrops.json');
      if (!response.ok) {
        throw new Error('Erro ao buscar biblioteca de cenários');
      }
      return await response.json();
    } catch (error) {
      console.error('[LibraryService] Falha ao buscar cenários:', error);
      return [];
    }
  }
}

export const getLibraryService = () => LibraryService.getInstance();
