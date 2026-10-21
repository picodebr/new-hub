/**
 * CostumeService - Gestão de imagens e recursos visuais (Fantasias).
 *
 * Responsabilidade: Administrar o repositório de fantasias de cada ator,
 * lidando com o processamento de arquivos (resizing, conversão) e atribuição
 * de IDs únicos.
 *
 * Operações Principais:
 * - addCostumeToSprite: Processamento e inclusão de nova imagem.
 * - switchCostume: Alteração da fantasia ativa de um ator.
 * - removeCostumeFromSprite: Limpeza de recursos visuais não utilizados.
 *
 * Interações: Utiliza BrowserFileSystem para leitura de mídia e impacta a
 * renderização no StageArea.
 */
import { CostumeData, SpriteData, BackdropData } from '../../domain/entities';
import { EventEmitter } from '../../lib/EventEmitter';
import { BrowserFileSystem } from '../../adapters/BrowserFileSystem';
import { ProjectEvents } from '../../domain/entities';

export class CostumeService {
  private emitter: EventEmitter<ProjectEvents>;
  private static processedCache = new Map<string, string>(); // Cache to avoid re-processing same files

  constructor(emitter: EventEmitter<ProjectEvents>) {
    this.emitter = emitter;
  }

  private getFileKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  public async addCostumeToSprite(
    spriteId: string,
    sprites: SpriteData[],
    file: File | undefined,
    addBackdropFn: (file?: File) => Promise<void>,
  ): Promise<void> {
    if (spriteId === 'stage') {
      await addBackdropFn(file);
      return;
    }

    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    let url = '';
    let name = '';

    if (file) {
      const cacheKey = this.getFileKey(file);
      if (CostumeService.processedCache.has(cacheKey)) {
        url = CostumeService.processedCache.get(cacheKey)!;
      } else {
        url = await BrowserFileSystem.processFile(file);
        CostumeService.processedCache.set(cacheKey, url);
      }
      name = file.name.split('.')[0];
    } else {
      url =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDQ4MCAzNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PC9zdmc+';
      name = `fantasia${sprites[spriteIndex].costumes.length + 1}`;
    }

    const newCostume: CostumeData = {
      id: `costume${Date.now()}`,
      name: name,
      url: url,
    };

    const updatedSprite = {
      ...sprites[spriteIndex],
      costumes: [...sprites[spriteIndex].costumes, newCostume],
      currentCostumeId: newCostume.id,
      costume: newCostume.url,
    };

    sprites[spriteIndex] = updatedSprite;
    this.emitter.emit('spritesChange', sprites);
  }

  public updateCostume(
    spriteId: string,
    costumeId: string,
    thumbnailUrl: string,
    stageUrl: string | undefined,
    sprites: SpriteData[],
    backdrops: BackdropData[],
    activeBackdropId: string,
  ): void {
    if (spriteId === 'stage') {
      const backdropIndex = backdrops.findIndex((b) => b.id === costumeId);
      if (backdropIndex !== -1) {
        backdrops[backdropIndex] = {
          ...backdrops[backdropIndex],
          url: thumbnailUrl,
          stageUrl: stageUrl || backdrops[backdropIndex].stageUrl || thumbnailUrl,
        };
        this.emitter.emit('backdropChange', backdrops);
        if (activeBackdropId === costumeId) {
          this.emitter.emit('activeBackdropChange', activeBackdropId);
        }
      }
      return;
    }

    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    const sprite = sprites[spriteIndex];
    const costumeIndex = sprite.costumes.findIndex((c) => c.id === costumeId);
    if (costumeIndex === -1) return;

    const updatedCostumes = [...sprite.costumes];
    updatedCostumes[costumeIndex] = {
      ...updatedCostumes[costumeIndex],
      url: thumbnailUrl,
      stageUrl: stageUrl || updatedCostumes[costumeIndex].stageUrl,
    };

    sprites[spriteIndex] = {
      ...sprite,
      costumes: updatedCostumes,
      costume: sprite.currentCostumeId === costumeId ? stageUrl || thumbnailUrl : sprite.costume,
    };

    this.emitter.emit('spritesChange', sprites);
  }

  public updateCostumeThumbnail(
    spriteId: string,
    costumeId: string,
    thumbnailUrl: string,
    stageUrl: string | undefined,
    sprites: SpriteData[],
    backdrops: BackdropData[],
  ): void {
    if (spriteId === 'stage') {
      const backdropIndex = backdrops.findIndex((b) => b.id === costumeId);
      if (backdropIndex !== -1) {
        backdrops[backdropIndex] = {
          ...backdrops[backdropIndex],
          url: thumbnailUrl,
          stageUrl: stageUrl || backdrops[backdropIndex].stageUrl || thumbnailUrl,
        };
        this.emitter.emit('backdropChange', backdrops);
      }
      return;
    }

    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    const sprite = sprites[spriteIndex];
    const costumeIndex = sprite.costumes.findIndex((c) => c.id === costumeId);
    if (costumeIndex === -1) return;

    const updatedCostumes = [...sprite.costumes];
    updatedCostumes[costumeIndex] = {
      ...updatedCostumes[costumeIndex],
      url: thumbnailUrl,
      stageUrl: stageUrl || updatedCostumes[costumeIndex].stageUrl,
    };

    sprites[spriteIndex] = { ...sprite, costumes: updatedCostumes };
    this.emitter.emit('spritesChange', sprites);
  }

  public renameCostume(spriteId: string, costumeId: string, newName: string, sprites: SpriteData[]): void {
    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    const sprite = sprites[spriteIndex];
    const costumeIndex = sprite.costumes.findIndex((c) => c.id === costumeId);
    if (costumeIndex === -1) return;

    const updatedCostumes = [...sprite.costumes];
    updatedCostumes[costumeIndex] = { ...updatedCostumes[costumeIndex], name: newName };

    sprites[spriteIndex] = { ...sprite, costumes: updatedCostumes };
    this.emitter.emit('spritesChange', sprites);
  }

  public switchCostume(spriteId: string, costumeId: string, sprites: SpriteData[], selectBackdropFn: (id: string) => void): void {
    if (spriteId === 'stage') {
      selectBackdropFn(costumeId);
      return;
    }

    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    const sprite = sprites[spriteIndex];
    const costume = sprite.costumes.find((c) => c.id === costumeId);
    if (costume) {
      sprites[spriteIndex] = {
        ...sprite,
        currentCostumeId: costume.id,
        costume: costume.stageUrl || costume.url,
      };
      this.emitter.emit('spritesChange', sprites);
    }
  }

  public removeCostumeFromSprite(spriteId: string, costumeId: string, sprites: SpriteData[], deleteBackdropFn: (id: string) => void): void {
    if (spriteId === 'stage') {
      deleteBackdropFn(costumeId);
      return;
    }

    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1 || sprites[spriteIndex].costumes.length <= 1) return;

    const sprite = sprites[spriteIndex];
    const updatedCostumes = sprite.costumes.filter((c) => c.id !== costumeId);

    let currentCostumeId = sprite.currentCostumeId;
    let costumeUrl = sprite.costume;

    if (currentCostumeId === costumeId) {
      const first = updatedCostumes[0];
      currentCostumeId = first.id;
      costumeUrl = first.stageUrl || first.url;
    }

    sprites[spriteIndex] = {
      ...sprite,
      costumes: updatedCostumes,
      currentCostumeId,
      costume: costumeUrl,
    };

    this.emitter.emit('spritesChange', sprites);
  }
  public duplicateCostume(spriteId: string, costumeId: string, sprites: SpriteData[]): void {
    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    const sprite = sprites[spriteIndex];
    const costume = sprite.costumes.find((c) => c.id === costumeId);
    if (!costume) return;

    const newCostume: CostumeData = {
      ...costume,
      id: `costume${Date.now()}`,
      name: `${costume.name} 2`,
    };

    sprites[spriteIndex] = {
      ...sprite,
      costumes: [...sprite.costumes, newCostume],
      currentCostumeId: newCostume.id,
      costume: newCostume.stageUrl || newCostume.url,
    };

    this.emitter.emit('spritesChange', sprites);
  }
}
