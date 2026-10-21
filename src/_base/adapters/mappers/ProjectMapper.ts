/**
 * Mapeamento entre entidades de domínio e modelos de persistência (JSON).
 */
import { getProjectService, IProjectContextUI, ProjectFile } from '@/_base/services/code';
import { ProjectData } from '../../domain/entities/Project';

export class ProjectMapper {
  /**
   * Converts UI Context and Sprite state to a Clean Domain ProjectData entity.
   */
  public static contextToEntity(context: IProjectContextUI): ProjectData {
    const projectService = getProjectService();
    // Clones são objetos de runtime — não devem ser persistidos no arquivo do projeto
    const allSprites = projectService.getSprites().filter((s) => !s.isClone);

    return {
      id: context.projectId || crypto.randomUUID(),
      name: context.projectName || 'Projeto Sem Nome',
      sprites: allSprites,
      backdrops: context.backdrops,
      activeSpriteId: context.activeSpriteId,
      activeBackdropId: context.activeBackdropId,
      settings: {
        mode: context.isUploadMode ? 'upload' : 'stage',
      },
      uploadMode: {
        blocks: context.uploadModeBlocks,
        code: context.uploadCode,
      },
      extensions: context.activeExtensions,
      extensionData: {
        ia: {
          activeStageModel: context.activeStageMLModel,
          activeUploadModel: context.activeUploadMLModel,
        },
      },
      broadcastMessages: projectService.getBroadcastMessages(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Converts a Clean Domain ProjectData entity back to the legacy ProjectFile DTO.
   * (Useful for file downloads)
   */
  public static entityToDto(project: ProjectData): ProjectFile {
    return {
      metadata: {
        version: project.metadata?.version || '1.0.0',
        timestamp: project.metadata?.timestamp || new Date().toISOString(),
      },
      settings: project.settings,
      stage: {
        activeSpriteId: project.activeSpriteId,
        backdrops: project.backdrops.map((b) => ({
          id: b.id,
          name: b.name,
          url: b.url,
          sounds: b.sounds ?? [],
          currentSoundId: b.currentSoundId ?? null,
        })),
        activeBackdropId: project.activeBackdropId,
      },
      sprites: project.sprites.map((s) => ({
        id: s.id,
        name: s.name,
        x: s.x,
        y: s.y,
        size: s.size,
        angle: s.angle,
        visible: s.visible,
        rotationStyle: s.rotationStyle,
        costume: s.costume,
        currentCostumeId: s.currentCostumeId,
        costumes: s.costumes || [],
        sounds: s.sounds || [],
        currentSoundId: s.currentSoundId ?? null,
        volume: s.volume ?? 100,
        code: s.code || '',
        blocks: s.blocks || { blocks: { languageVersion: 0, blocks: [] } },
        variables: s.variables || [],
      })),
      uploadMode: {
        blocks: project.uploadMode.blocks,
        code: project.uploadMode.code,
      },
      extensions: project.extensions,
      extensionData: project.extensionData,
      customProcedures: project.customProcedures || [],
      broadcastMessages: project.broadcastMessages || ['mensagem1'],
      updatedAt: project.updatedAt,
    };
  }
}
