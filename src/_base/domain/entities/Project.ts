/**
 * ProjectData - Estrutura de dados central que define um projeto no PicoCode Hub.
 *
 * Responsabilidade: Consolida o estado persistível de um projeto, incluindo sprites,
 * cenários, variáveis globais e configurações de ambiente (Palco vs Hardware).
 *
 * Interfaces:
 * - ProjectData: Objeto de dados principal para salvamento e carregamento.
 * - ProjectEvents: Definição de eventos emitidos pelo ProjectService ao alterar o estado.
 *
 * Relacionamentos: Depende de SpriteData, BackdropData e IBlocklyWorkspaceJson para
 * compor a árvore completa do projeto.
 */
import { SpriteData, SpriteVariable, SpriteList } from './Sprite';
import { BackdropData } from './Backdrop';
import { IBlocklyWorkspaceJson } from './IBlockly';
import { IExtensionData } from './IMLModel';
import { CustomBlockSpec } from './ICustomBlock';

export interface ProjectData {
  id: string;
  name: string;
  sprites: SpriteData[];
  backdrops: BackdropData[];
  activeSpriteId: string;
  activeBackdropId: string;
  settings: {
    mode: 'stage' | 'upload';
  };
  uploadMode: {
    blocks: IBlocklyWorkspaceJson | null;
    code: string;
  };
  extensions?: string[];
  extensionData?: IExtensionData;
  customProcedures?: CustomBlockSpec[];
  broadcastMessages?: string[];
  updatedAt: number;
  metadata?: {
    version: string;
    timestamp: string;
  };
}

export interface ProjectEvents {
  spritesChange: SpriteData[];
  activeSpriteChange: string;
  backdropChange: BackdropData[];
  activeBackdropChange: string;
  stageVariablesChange: SpriteVariable[];
  uploadVariablesChange: SpriteVariable[];
  stageListsChange: SpriteList[];
  uploadListsChange: SpriteList[];
  broadcast: string; // Evento disparado quando uma mensagem é transmitida
  broadcastDone: string; // Evento disparado quando todos os scripts daquela mensagem terminaram
  backdropDone: string; // Evento disparado quando todos os scripts daquela mudança de cenário terminaram
  projectLoaded: void; // Evento disparado após carregamento completo de um arquivo JSON/PiBoard
}
