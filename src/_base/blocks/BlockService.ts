/**
 * BlockService - Registro central e gestão de blocos no core do Blockly.
 *
 * Responsabilidade: Garantir que todas as definições de blocos (Stage e Board)
 * sejam registradas corretamente no motor do Blockly, além de fornecer as
 * configurações de toolbox adequadas para cada modo de operação.
 *
 * Operações Principais:
 * - registerAllBlocks: Inicialização única das definições JSON no Blockly.Blocks.
 * - getToolbox: Seleção dinâmica da toolbox (Stage vs Board) baseada no estado da UI.
 */

import * as Blockly from 'blockly/core';
import { BlockStageDefinitions } from '../config/stage_blocks';
import { IBlockDefinition, IToolboxDefinition } from '../domain/entities/IBlockly';
import { ToolboxDefinition, ToolboxUploadDefinition } from '../config/toolbox';
import { BlockBoardDefinitions } from '../config/custom_definitions';

export class BlockService {
  // Controla se os blocos já foram registrados para evitar duplicidade
  private static blocksRegistered = false;

  /**
   * Registra todas as definições de blocos no Blockly.
   * Deve ser chamado uma única vez durante a inicialização da aplicação.
   */
  public static registerAllBlocks(): void {
    if (this.blocksRegistered) {
      return;
    }

    try {
      // 1. Registra os blocos do modo "Stage" (Palco/Visual)
      // Estes blocos são usados para a lógica de animação e interação visual.
      (BlockStageDefinitions as IBlockDefinition[]).forEach((blockDef: IBlockDefinition) => {
        if (!Blockly.Blocks[blockDef.type]) {
          Blockly.Blocks[blockDef.type] = {
            init: function (this: Blockly.Block) {
              this.jsonInit(blockDef);
            },
          };
        }
      });

      // 2. Registra os blocos do modo "Board" (Placa/Arduino)
      // Estes blocos são usados para gerar código C++ para o hardware.
      (BlockBoardDefinitions as IBlockDefinition[]).forEach((blockDef: IBlockDefinition) => {
        if (!Blockly.Blocks[blockDef.type]) {
          Blockly.Blocks[blockDef.type] = {
            init: function (this: Blockly.Block) {
              this.jsonInit(blockDef);
            },
          };
        }
      });

      this.blocksRegistered = true;
    } catch (error) {
      console.error('[BlockService] Erro ao registrar blocos:', error);
      throw error;
    }
  }

  /**
   * Obtém a configuração da toolbox para o modo Stage.
   * Retorna a definição completa das categorias e blocos disponíveis no "Palco".
   */
  public static getStageToolbox(): IToolboxDefinition {
    return ToolboxDefinition as IToolboxDefinition;
  }

  /**
   * Obtém a configuração da toolbox para o modo Board (Placa).
   * Retorna os blocos específicos para programação de hardware/microcontrolador.
   */
  public static getBoardToolbox(): IToolboxDefinition {
    return ToolboxUploadDefinition as IToolboxDefinition;
  }

  /**
   * Obtém a toolbox correta baseada no modo atual.
   * @param isUploadMode - True para modo Placa (Board), false para modo Palco (Stage).
   */
  public static getToolbox(isUploadMode: boolean): IToolboxDefinition {
    return isUploadMode ? this.getBoardToolbox() : this.getStageToolbox();
  }

  /**
   * Reseta o estado de registro.
   * Útil para testes automatizados ou recarregamento a quente (hot reload).
   */
  public static resetRegistration(): void {
    this.blocksRegistered = false;
  }
}

// Funções de conveniência exportadas para facilitar o uso em outros componentes
export const registerBlocks = () => BlockService.registerAllBlocks();
export const getToolbox = (isUploadMode: boolean) => BlockService.getToolbox(isUploadMode);
