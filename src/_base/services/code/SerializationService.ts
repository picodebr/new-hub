/**
 * Gerencia o salvamento e carregamento de projetos seguindo a arquitetura Clean.
 * Converte estados de UI em entidades de domínio e DTOs para persistência.
 */
import { registerCustomBlockFromSpec } from '../../config/custom_definitions';
import {
  SpriteData,
  SpriteVariable,
  CostumeData,
  BackdropData,
  IBlocklyBlock,
  IBlocklyWorkspaceJson,
  IMLModel,
  IExtensionData,
  CustomBlockSpec,
  CustomBlockArg,
} from '../../domain/entities';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { arduinoGenerator } from '@/_base/generators/board';
import { LocalStorageProjectRepository } from '../../adapters/LocalStorageProjectRepository';
import { SaveProjectUseCase } from '../../use-cases/SaveProjectUseCase';
import { ProjectMapper } from '../../adapters/mappers/ProjectMapper';
import { getProjectService } from './ProjectService';
import { updateCodeProject } from '../codeProject';
import { ICodeProject } from '@/_base/interfaces/codeProject/IProject';
import { getPresignedUrl, uploadFile } from '../upload';

// Re-exporta interface para componentes que a utilizam
export interface IProjectContextUI {
  projectId?: string;
  projectName?: string;
  isUploadMode: boolean;
  uploadModeBlocks: IBlocklyWorkspaceJson | null;
  uploadCode: string;
  setIsUploadMode: (val: boolean) => void;
  setUploadModeBlocks: (val: IBlocklyWorkspaceJson | null) => void;
  setUploadCode: (val: string) => void;
  backdrops: BackdropData[];
  activeBackdropId: string;
  activeSpriteId: string;
  activeExtensions: string[];
  setActiveExtensions: (exts: string[]) => void;
  activeStageMLModel: IMLModel | null;
  setActiveStageMLModel: (model: IMLModel | null) => void;
  activeUploadMLModel: IMLModel | null;
  setActiveUploadMLModel: (model: IMLModel | null) => void;
}

// Re-exporta DTO de ProjectFile para compatibilidade retroativa
export interface SpriteDataDTO extends Partial<SpriteData> {
  blocks: IBlocklyWorkspaceJson;
  costumes?: CostumeData[];
  currentCostumeId?: string;
}

export interface ProjectFile {
  metadata: { version: string; timestamp: string };
  settings: { mode: 'stage' | 'upload' };
  stage: { activeSpriteId: string; backdrops?: BackdropData[]; activeBackdropId?: string };
  sprites: SpriteDataDTO[];
  uploadMode: { blocks: IBlocklyWorkspaceJson | null; code: string };
  extensions?: string[];
  extensionData?: IExtensionData;
  customProcedures?: CustomBlockSpec[];
  broadcastMessages?: string[];
  updatedAt: number;
  codeVersion?: '1.0-webview' | '1.0';
}

// const repository = new LocalStorageProjectRepository();
// const saveUseCase = new SaveProjectUseCase(repository);
// loadUseCase removido (carregamento é feito por arquivo direto, não por ID)

/**
 * Identifica e faz upload de assets base64 (data: URLs) para o S3 de forma recursiva.
 * Isso reduz drasticamente o tamanho do payload JSON enviado ao servidor, evitando erros 413.
 */
const uploadBase64Assets = async (obj: any): Promise<void> => {
  if (!obj || typeof obj !== 'object') return;

  const entries = Object.entries(obj);
  for (const [key, value] of entries) {
    if (typeof value === 'string' && value.startsWith('data:')) {
      try {
        // Converte data URL para Blob/File
        const res = await fetch(value);
        const blob = await res.blob();
        const mimeType = value.split(';')[0].split(':')[1] || 'image/png';
        const extension = mimeType.split('/')[1] || 'png';
        const file = new File([blob], `asset-${Date.now()}.${extension}`, { type: mimeType });

        // Upload para o S3
        const { link, full_path } = await getPresignedUrl(mimeType, 'code-assets' as any, 'public-read' as any);
        await uploadFile(link, file);

        // Substitui o base64 pela URL do S3 no objeto original
        obj[key] = full_path;
      } catch (err) {
        console.error('[SerializationService] Falha ao migrar asset base64:', err);
      }
    } else if (value && typeof value === 'object') {
      await uploadBase64Assets(value);
    }
  }
};

export const SerializationService = {
  /**
   * Helper legado para compatibilidade com a UI atual, mas internamente usa Clean Architecture.
   */
  saveProject: async (
    context: IProjectContextUI,
    project: ICodeProject,
    fileName: string = 'meu_projeto.json',
    currentWorkspace?: Blockly.WorkspaceSvg,
  ) => {
    try {
      // 1. SINCRONIZAÇÃO: Antes de salvar o arquivo, extraímos o JSON do workspace
      // ativo (Blockly) e o código gerado, atualizando o ProjectService para
      // garantir que o arquivo final reflita o estado atual da tela.
      if (currentWorkspace && !context.isUploadMode) {
        const projectService = getProjectService();
        const activeSpriteId = projectService.getActiveSpriteId();
        const json = Blockly.serialization.workspaces.save(currentWorkspace);
        const code = javascriptGenerator.workspaceToCode(currentWorkspace);

        const blocksJson: IBlocklyWorkspaceJson = {
          blocks: (json.blocks as IBlocklyWorkspaceJson['blocks']) || { languageVersion: 0, blocks: [] },
          variables: json.variables as IBlocklyWorkspaceJson['variables'],
        };

        projectService.updateSpriteBlocks(activeSpriteId, blocksJson, code);
      }

      if (currentWorkspace && context.isUploadMode) {
        const json = Blockly.serialization.workspaces.save(currentWorkspace);
        const blocksJson: IBlocklyWorkspaceJson = {
          blocks: (json.blocks as IBlocklyWorkspaceJson['blocks']) || { languageVersion: 0, blocks: [] },
          variables: json.variables as IBlocklyWorkspaceJson['variables'],
        };
        const code = arduinoGenerator.workspaceToCode(currentWorkspace);
        context.uploadModeBlocks = blocksJson;
        context.uploadCode = code;
        context.setUploadModeBlocks(blocksJson);
        context.setUploadCode(code);
      }

      // 2. MAPEAMENTO E PERSISTÊNCIA: Converte o contexto da UI em uma entidade
      // de domínio e salva no LocalStorage via UseCase.
      // await saveUseCase.execute(projectEntity);
      const projectEntity = ProjectMapper.contextToEntity(context);

      // 3. DOWNLOAD: Gera o Blob do DTO para permitir que o usuário salve o arquivo físico.
      const dto = ProjectMapper.entityToDto(projectEntity);

      // Salva specs de custom procedures para registro confiável ao reabrir.
      // O método de varredura de blocos (fallback) pode falhar dependendo do formato do JSON.
      if (currentWorkspace) {
        const seenProcIds = new Set<string>();
        const customProcedures: CustomBlockSpec[] = [];
        currentWorkspace.getAllBlocks(false).forEach((block) => {
          if (!block.type.startsWith('custom_def_')) return;
          const procId = block.type.replace('custom_def_', '');
          if (seenProcIds.has(procId)) return;
          seenProcIds.add(procId);
          const protoBlock = block.getInputTargetBlock('PROTOTYPE');
          if (!protoBlock) return;
          const name = protoBlock.getFieldValue('NAME') || procId;
          const args: CustomBlockArg[] = [];
          let i = 0;
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const argInput = protoBlock.getInput('ARG_' + i);
            if (!argInput) break;
            const argBlock = argInput.connection?.targetBlock();
            let type: CustomBlockArg['type'] = 'input';
            if (argBlock?.type === 'argument_reporter_number') type = 'number';
            else if (argBlock?.type === 'argument_reporter_boolean') type = 'bool';
            args.push({ type, value: argBlock?.getFieldValue('VALUE') || `arg${i + 1}` });
            i++;
          }
          customProcedures.push({ id: procId, name, args });
        });
        dto.customProcedures = customProcedures;
      }

      // 4. MIGRAÇÃO DE ASSETS: Antes de enviar para a API, garante que nenhum base64 pesado
      // esteja no JSON, enviando-os para o S3.
      await uploadBase64Assets(dto);

      await updateCodeProject({ id: project.id, metadata: dto });

      // const jsonString = JSON.stringify(dto, null, 2);
      // const blob = new Blob([jsonString], { type: 'application/json' });
      // const url = URL.createObjectURL(blob);

      // const link = document.createElement('a');
      // link.href = url;
      // link.download = fileName;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      // URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao salvar projeto:', e);
      alert('Erro ao salvar projeto.');
    }
  },

  /**
   * Carrega um projeto a partir de um JSON importado pelo usuário ou da API.
   */
  loadProject: async (inputJson: any, context: IProjectContextUI) => {
    try {
      if (!inputJson) return;
      const rawMeta: ProjectFile = inputJson?.sprites
        ? inputJson
        : inputJson?.metadata?.sprites
        ? inputJson.metadata
        : inputJson;

      if (!rawMeta || (!rawMeta.sprites && !rawMeta.uploadMode)) return;

      const hasUploadBlocks = Boolean(
        rawMeta?.uploadMode?.blocks?.blocks?.blocks &&
        rawMeta.uploadMode.blocks.blocks.blocks.length > 0
      );
      const hasStageBlocks = Boolean(
        rawMeta?.sprites?.some(
          (s: any) => s?.blocks?.blocks?.blocks && s.blocks.blocks.blocks.length > 0
        )
      );
      const isProjectUploadMode =
        rawMeta?.settings?.mode === 'upload' ||
        (!rawMeta?.settings?.mode && hasUploadBlocks && !hasStageBlocks);

      // 1. Restaura o modo (Palco vs Upload)
      context.setIsUploadMode(isProjectUploadMode);

      // 2. Restaura as extensões ativas
      if (rawMeta.extensions) context.setActiveExtensions(rawMeta.extensions);
      if (rawMeta.extensionData?.ia) {
        context.setActiveStageMLModel(rawMeta.extensionData.ia.activeStageModel);
        context.setActiveUploadMLModel(rawMeta.extensionData.ia.activeUploadModel);
      }

      // 3. Mapeia sprites e cenários do JSON para entidades
      const projectService = getProjectService();
      const newSprites: SpriteData[] = (rawMeta.sprites || [])
        .filter((s: SpriteDataDTO) => !s.isClone)
        .map((s: SpriteDataDTO) => ({
          id: s.id || crypto.randomUUID(),
          name: s.name || 'Sem nome',
          x: s.x ?? 0,
          y: s.y ?? 0,
          size: s.size ?? 100,
          angle: s.angle ?? 90,
          visible: s.visible ?? true,
          costume: s.costume || '',
          costumes: s.costumes || [{ id: 'default', name: 'default', url: s.costume || '' }],
          currentCostumeId: s.currentCostumeId || 'default',
          sounds: s.sounds || [],
          currentSoundId: s.currentSoundId ?? null,
          volume: s.volume ?? 100,
          bubbleText: s.bubbleText || '',
          bubbleType: s.bubbleType || null,
          blocks: s.blocks,
          variables: s.variables || [],
          code: s.code || '',
          rotationStyle: s.rotationStyle || 'all around',
          draggable: s.draggable ?? false,
        }));

      // Registra blocos customizados por varredura (Fallback para arquivos antigos)
      const registeredIDs = new Set<string>();
      (rawMeta.sprites || []).forEach((sprite: SpriteDataDTO) => {
        if (sprite.blocks?.blocks?.blocks) {
          const traverseBlocks = (block: IBlocklyBlock) => {
            if (!block) return;
            if (typeof block.type === 'string' && block.type.startsWith('custom_def_')) {
              const id = block.type.replace('custom_def_', '');
              if (!registeredIDs.has(id)) {
                let protoBlock: IBlocklyBlock | null = null;
                const inputs = block.inputs as unknown as Record<string, { block?: IBlocklyBlock; shadow?: IBlocklyBlock }>;
                // Blockly serializes shadow blocks (which prototype IS) under "shadow", not "block"
                if (inputs?.PROTOTYPE?.block) {
                  protoBlock = inputs.PROTOTYPE.block;
                } else if (inputs?.PROTOTYPE?.shadow) {
                  protoBlock = inputs.PROTOTYPE.shadow;
                }

                if (protoBlock) {
                  const fields = protoBlock.fields as Record<string, string>;
                  const protoInputs = protoBlock.inputs as unknown as Record<
                    string,
                    { shadow?: Record<string, string>; block?: Record<string, string> }
                  >;
                  const name = fields ? fields.NAME : 'Function ' + id;
                  const args: CustomBlockArg[] = [];
                  if (protoInputs) {
                    let i = 0;
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                      const key = 'ARG_' + i;
                      if (!protoInputs[key]) break;
                      const input = protoInputs[key];
                      const shadow = input.shadow || input.block;
                      if (shadow) {
                        let type = 'input';
                        if (shadow.type === 'argument_reporter_number') type = 'number';
                        else if (shadow.type === 'argument_reporter_boolean') type = 'bool';
                        else if (shadow.type === 'argument_reporter_string') type = 'input';
                        args.push({ type: type, value: `arg${i + 1} ` });
                      } else {
                        args.push({ type: 'input', value: `arg${i + 1} ` });
                      }
                      i++;
                    }
                  }
                  try {
                    registerCustomBlockFromSpec({ id, name, args });
                    registeredIDs.add(id);
                  } catch (e) {
                    console.error('Falha no registro de fallback para', id, e);
                  }
                }
              }
            }
            if (block.next) traverseBlocks(block.next.block);
          };

          const topBlocks = sprite.blocks.blocks.blocks;
          if (Array.isArray(topBlocks)) {
            topBlocks.forEach((b: IBlocklyBlock) => traverseBlocks(b));
          }
        }
      });

      // Usa Metadados se disponíveis (Método preferido)
      if (rawMeta.customProcedures && Array.isArray(rawMeta.customProcedures)) {
        rawMeta.customProcedures.forEach((proc: CustomBlockSpec) => {
          registerCustomBlockFromSpec(proc);
        });
      }

      projectService.setSprites(newSprites);

      // Restore VariableService from saved sprite data so the toolbox callback
      // sees the correct variable names after the workspace is loaded.
      // Without this, the service keeps its default {id:'var1', name:'minha variável'}
      // while the workspace loads the renamed variable, causing an ID collision crash.
      const restoredVarMap = new Map<string, SpriteVariable>();
      for (const sprite of newSprites) {
        for (const v of sprite.variables || []) {
          if (v?.id) restoredVarMap.set(v.id, v);
        }
      }
      if (restoredVarMap.size > 0) {
        projectService.setStageVariables(Array.from(restoredVarMap.values()));
      }

      // Restore upload variables from the blocks JSON (only Blockly format available)
      const uploadVarsRaw = rawMeta.uploadMode?.blocks?.variables as Array<{ name: string; id: string; type: string }> | undefined;
      if (uploadVarsRaw && uploadVarsRaw.length > 0) {
        const uploadVars: SpriteVariable[] = uploadVarsRaw
          .filter((v) => v.type && v.type !== '')
          .map((v) => ({ id: v.id, name: v.name, type: v.type, value: v.type === 'Number' ? 0 : '', isGlobal: true }));
        if (uploadVars.length > 0) projectService.setUploadVariables(uploadVars);
      }

      if (rawMeta.stage?.backdrops) {
        projectService.setBackdrops(
          rawMeta.stage.backdrops.map((b: BackdropData & { sounds?: unknown; currentSoundId?: unknown }) => ({
            id: b.id,
            name: b.name,
            url: b.url,
            sounds: Array.isArray(b.sounds) ? b.sounds : [],
            currentSoundId: typeof b.currentSoundId === 'string' ? b.currentSoundId : null,
          })),
        );
      }

      if (rawMeta.stage?.activeSpriteId) projectService.setActiveSpriteId(rawMeta.stage.activeSpriteId);
      if (rawMeta.stage?.activeBackdropId) projectService.setActiveBackdropId(rawMeta.stage.activeBackdropId);

      if (rawMeta.uploadMode) {
        const blocks = rawMeta.uploadMode.blocks || null;
        const uploadBlocksJson = blocks as unknown as { blocks?: { blocks?: unknown[] } };
        const hasContents = !!(uploadBlocksJson?.blocks?.blocks && uploadBlocksJson.blocks.blocks.length > 0);
        context.setUploadModeBlocks(hasContents ? blocks : null);
        context.setUploadCode(rawMeta.uploadMode.code || '');
      }

      // 5. Restaura mensagens de broadcast
      if (rawMeta.broadcastMessages) {
        projectService.setBroadcastMessages(rawMeta.broadcastMessages);
      }

      // AVISA QUE O PROJETO MUDOU: Essencial para forçar reload do Blockly
      projectService.emit('projectLoaded', undefined);
    } catch (err) {
      console.error('Erro ao carregar projeto:', err);
    }
  },

  resetProject: (context: IProjectContextUI) => {
    const projectService = getProjectService();
    projectService.reset();
    context.setIsUploadMode(false);
    context.setActiveExtensions([]);
    context.setActiveStageMLModel(null);
    context.setActiveUploadMLModel(null);
    context.setUploadModeBlocks(null);
    context.setUploadCode('');
    projectService.emit('projectLoaded', undefined);
  },

  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>, context: IProjectContextUI) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        SerializationService.loadProject(json, context);
      } catch (err) {
        console.error('Erro ao ler arquivo:', err);
        alert('Erro ao ler arquivo de projeto.');
      }
    };
    reader.readAsText(file);
  },
};
