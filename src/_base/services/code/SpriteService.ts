/**
 * SpriteService - Gestão da lógica e estado dos Atores (Sprites).
 *
 * Responsabilidade: Controlar o ciclo de vida dos atores, incluindo criação,
 * deleção, seleção e atualização de propriedades físicas e lógicas.
 * Garante a integridade das referências entre atores e seus blocos de código.
 *
 * Operações Principais:
 * - addSprite/deleteSprite: Manipulação da coleção de atores.
 * - updateSprite: Modificação de posição, ângulo, tamanho e visibilidade.
 * - updateSpriteBlocks: Persistência do workspace Blockly associado ao ator.
 *
 * Interações: Colabora estreitamente com ProjectService para emissão de eventos
 * e BackdropService para sincronização de cenários.
 */
import { SpriteData, IBlocklyWorkspaceJson, SpriteVariable, BackdropData } from '../../domain/entities';
import { EventEmitter } from '../../lib/EventEmitter';
import { BrowserFileSystem } from '../../adapters/BrowserFileSystem';
import { ProjectEvents } from '../../domain/entities';

export class SpriteService {
  private sprites: SpriteData[] = [];
  private activeSpriteId: string = '';
  private emitter: EventEmitter<ProjectEvents>;
  private stageBlocks?: IBlocklyWorkspaceJson;
  private stageCode: string = '';
  private stateRevision: number = 0; // Contador de revisões para sincronização visual (heartbeat)

  constructor(emitter: EventEmitter<ProjectEvents>) {
    this.emitter = emitter;
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    this.sprites = [
      {
        id: 'sprite1',
        name: 'Tobi',
        x: 0,
        y: 0,
        angle: 90,
        size: 100,
        visible: true,
        rotationStyle: 'all around',
        costume: '/svg/spriteLibrary/Tobi/tobi_costume1.svg',
        currentCostumeId: 'c1',
        costumes: [
          { id: 'c1', name: 'tobi_costume1', url: '/svg/spriteLibrary/Tobi/tobi_costume1.svg' },
          { id: 'c2', name: 'tobi_costume2', url: '/svg/spriteLibrary/Tobi/tobi_costume2.svg' },
        ],
        sounds: [{ id: 'sound1', name: 'Latido', url: '/song/tobi_sound.mp3', format: 'mp3' }],
        currentSoundId: 'sound1',
        volume: 100,
        soundEffects: {},
        bubbleText: '',
        bubbleType: null,
        draggable: false,
        blocks: undefined,
        code: '',
      },
    ];
    this.activeSpriteId = 'sprite1';
  }

  public getSprites(): SpriteData[] {
    return this.sprites;
  }

  /**
   * Retorna a versão atual do estado dos atores.
   * Usado pelo Heartbeat do ProjectContext para decidir se a UI precisa de um re-render.
   */
  public getStateRevision(): number {
    return this.stateRevision;
  }

  /**
   * Incrementa manualmente a revisão do estado.
   * Útil quando sub-serviços modificam os dados diretamente (ex: CostumeService).
   */
  public bumpRevision(): void {
    this.stateRevision++;
  }

  public getActiveSprite(): SpriteData {
    return this.sprites.find((s) => s.id === this.activeSpriteId) || this.sprites[0];
  }

  public getActiveSpriteId(): string {
    return this.activeSpriteId;
  }

  public getSpriteById(id: string, activeBackdropId: string, backdrops: BackdropData[]): SpriteData | undefined {
    if (id === 'stage') {
      const activeBackdrop = backdrops.find((b: BackdropData) => b.id === activeBackdropId);
      return {
        id: 'stage',
        name: 'Palco',
        costumes: backdrops as any,
        currentCostumeId: activeBackdropId,
        x: 0,
        y: 0,
        angle: 90,
        size: 100,
        visible: true,
        rotationStyle: 'all around',
        costume: activeBackdrop?.url || '',
        sounds: activeBackdrop?.sounds || [],
        currentSoundId: activeBackdrop?.currentSoundId || null,
        volume: 100,
        soundEffects: {},
        bubbleText: '',
        bubbleType: null,
        blocks: this.stageBlocks,
        code: this.stageCode,
      } as SpriteData;
    }
    return this.sprites.find((s) => s.id === id);
  }

  public async addSprite(file?: File): Promise<void> {
    const newId = `sprite${Date.now()}`;

    const BLANK_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDQ4MCAzNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PC9zdmc+';

    const createSprite = (url: string = BLANK_SVG, costumeName: string = 'fantasia1'): SpriteData => {
      const isBlank = url === BLANK_SVG;
      return {
        id: newId,
        name: `Ator ${this.sprites.length + 1}`,
        x: 0,
        y: 0,
        angle: 90,
        size: 100,
        visible: true,
        rotationStyle: 'all around',
        costume: url,
        currentCostumeId: 'c1',
        costumes: [{ id: 'c1', name: costumeName, url: url }],
        sounds: [],
        currentSoundId: null,
        volume: 100,
        soundEffects: {},
        bubbleText: '',
        bubbleType: null,
        draggable: false,
        blocks: {
          blocks: { languageVersion: 0, blocks: [] },
          variables: [],
        },
        variables: [],
        code: '',
      };
    };

    if (file) {
      const url = await BrowserFileSystem.processFile(file);
      const name = file.name.split('.')[0];
      this.sprites.push(createSprite(url, name));
    } else {
      this.sprites.push(createSprite());
    }

    this.activeSpriteId = newId;
    this.stateRevision++;
    this.emitter.emit('spritesChange', this.sprites);
    this.emitter.emit('activeSpriteChange', newId);
  }

  public async addSpriteFromLibrary(
    name: string,
    url: string,
    costumes?: { name: string; url: string }[],
    sounds?: { name: string; url: string; format: 'wav' | 'mp3' }[],
  ): Promise<void> {
    const newId = `sprite${Date.now()}`;

    const mappedSounds =
      sounds && sounds.length > 0 ? sounds.map((s, i) => ({ id: `sound${i + 1}`, name: s.name, url: s.url, format: s.format })) : [];

    const sprite: SpriteData = {
      id: newId,
      name: name,
      x: 0,
      y: 0,
      angle: 90,
      size: 100,
      visible: true,
      rotationStyle: 'all around',
      costume: url,
      currentCostumeId: costumes && costumes.length > 0 ? 'c1' : 'c1',
      costumes:
        costumes && costumes.length > 0
          ? costumes.map((c, i) => ({ id: `c${i + 1}`, name: c.name, url: c.url }))
          : [{ id: 'c1', name: name, url: url }],
      sounds: mappedSounds,
      currentSoundId: mappedSounds.length > 0 ? mappedSounds[0].id : null,
      volume: 100,
      soundEffects: {},
      bubbleText: '',
      bubbleType: null,
      draggable: false,
      blocks: {
        blocks: { languageVersion: 0, blocks: [] },
        variables: [],
      },
      variables: [],
      code: '',
    };

    this.sprites.push(sprite);
    this.activeSpriteId = newId;
    this.stateRevision++;
    this.emitter.emit('spritesChange', this.sprites);
    this.emitter.emit('activeSpriteChange', newId);
  }

  public async addSurpriseSprite(): Promise<void> {
    const libraryService = (await import('./LibraryService')).getLibraryService();
    const characters = await libraryService.getCharacters();

    if (characters.length > 0) {
      const randomSprite = characters[Math.floor(Math.random() * characters.length)];
      await this.addSpriteFromLibrary(randomSprite.name, randomSprite.url, randomSprite.costumes);
    } else {
      await this.addSprite();
    }
  }

  public deleteSprite(id: string): void {
    if (this.sprites.length <= 1) {
      console.warn('[SpriteService] Não é possível deletar o último ator');
      return;
    }

    this.sprites = this.sprites.filter((s) => s.id !== id);

    if (this.activeSpriteId === id) {
      this.activeSpriteId = this.sprites[0].id;
      this.emitter.emit('activeSpriteChange', this.activeSpriteId);
    }

    this.stateRevision++;
    this.emitter.emit('spritesChange', this.sprites);
  }

  public createClone(id: string): SpriteData | undefined {
    const sprite = this.getSprites().find((s) => s.id === id);
    if (!sprite) return undefined;

    // Resolve o sprite raiz: se o alvo já é um clone, sobe até o original.
    // Isso garante que parentId aponta sempre para o sprite original,
    // não para um clone intermediário, o que permite que isTouching detecte
    // todos os clones de uma família através do filtro s.parentId === originalId.
    const rootId = sprite.isClone && sprite.parentId ? sprite.parentId : sprite.id;
    const root = this.getSprites().find((s) => s.id === rootId) || sprite;

    // Cria IDs únicos para o clone e suas fantasias
    const cloneId = `clone_${rootId}_${Date.now()}`;

    // Deep copy simples para o clone (parte do estado do sprite chamador: posição, fantasia atual)
    const clone: SpriteData = {
      ...JSON.parse(JSON.stringify(sprite)),
      id: cloneId,
      name: `${root.name} (clone)`,
      isClone: true,
      parentId: rootId, // Aponta sempre para o sprite original, nunca para outro clone
      // Mantemos a referência aos blocos e código do root para execução
      blocks: root.blocks,
      code: root.code,
    };

    this.sprites.push(clone);
    this.stateRevision++;
    this.emitter.emit('spritesChange', [...this.sprites]);
    return clone;
  }

  public duplicateSprite(id: string): SpriteData | undefined {
    const sprite = this.getSprites().find((s) => s.id === id);
    if (!sprite) return undefined;

    const newId = `sprite${Date.now()}`;
    const newSprite: SpriteData = {
      ...JSON.parse(JSON.stringify(sprite)),
      id: newId,
      name: `${sprite.name} 2`,
      isClone: false,
      parentId: undefined,
    };

    this.sprites.push(newSprite);
    this.stateRevision++;
    this.emitter.emit('spritesChange', [...this.sprites]);
    return newSprite;
  }

  public clearClones(): void {
    const originalCount = this.sprites.length;
    this.sprites = this.sprites.filter((s) => !s.isClone);
    if (this.sprites.length !== originalCount) {
      this.stateRevision++;
      this.emitter.emit('spritesChange', [...this.sprites]);
    }
  }

  /**
   * Sincroniza todos os clones com seus respectivos pais.
   * Útil após mudanças estruturais (adição de fantasias, variáveis, etc).
   */
  public syncAllClones(): void {
    let changed = false;
    this.sprites.forEach((s, idx) => {
      if (s.isClone && s.parentId) {
        const parent = this.sprites.find((p) => p.id === s.parentId);
        if (parent) {
          this.sprites[idx] = this.mergeParentDataIntoClone(s, parent);
          changed = true;
        }
      }
    });

    if (changed) {
      this.stateRevision++;
      this.emitter.emit('spritesChange', [...this.sprites]);
    }
  }

  private mergeParentDataIntoClone(clone: SpriteData, parent: SpriteData): SpriteData {
    return {
      ...clone,
      costumes: parent.costumes,
      costume: parent.costumes.find((c) => c.id === clone.currentCostumeId)?.url || clone.costume,
      blocks: parent.blocks,
      code: parent.code,
      variables: parent.variables,
      rotationStyle: parent.rotationStyle,
    };
  }

  public selectSprite(id: string): void {
    const exists = this.sprites.find((s) => s.id === id) || id === 'stage';
    if (exists) {
      this.activeSpriteId = id;
      this.stateRevision++;
      this.emitter.emit('activeSpriteChange', id);
    }
  }

  public updateSprite(id: string, changes: Partial<SpriteData>, selectBackdropFn: (id: string) => void, silent: boolean = false): void {
    if (id === 'stage') {
      if (changes.currentCostumeId) {
        selectBackdropFn(changes.currentCostumeId);
      }
      return;
    }

    const index = this.sprites.findIndex((s) => s.id === id);
    if (index !== -1) {
      const oldValue = this.sprites[index];
      this.sprites[index] = { ...oldValue, ...changes };
      this.stateRevision++;

      // PROPRAGAÇÃO PARA CLONES
      // Se mudamos fantasias, variáveis ou estilo de rotação, propagamos para os clones deste pai
      if (changes.costumes || changes.variables || changes.rotationStyle) {
        this.sprites.forEach((s, idx) => {
          if (s.isClone && s.parentId === id) {
            this.sprites[idx] = this.mergeParentDataIntoClone(s, this.sprites[index]);
          }
        });
      }

      if (!silent) {
        this.emitter.emit('spritesChange', [...this.sprites]);
      }
    }
  }

  public updateSpriteBlocks(id: string, blocks: IBlocklyWorkspaceJson, code: string, variables?: SpriteVariable[]): void {
    if (id === 'stage') {
      this.stageBlocks = blocks;
      this.stageCode = code;
      this.stateRevision++;
      return;
    }

    const index = this.sprites.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.sprites[index] = {
        ...this.sprites[index],
        blocks: blocks,
        code: code,
        variables: variables || this.sprites[index].variables,
      };

      // PROPAGAÇÃO DE CÓDIGO PARA CLONES
      // Clones devem SEMPRE usar o código mais recente do pai
      this.sprites.forEach((s, idx) => {
        if (s.isClone && s.parentId === id) {
          this.sprites[idx] = this.mergeParentDataIntoClone(s, this.sprites[index]);
        }
      });

      this.stateRevision++;
    }
  }

  public getStageBlocks(): { blocks: IBlocklyWorkspaceJson | undefined; code: string } {
    return { blocks: this.stageBlocks, code: this.stageCode };
  }

  public setSprites(newSprites: SpriteData[]): void {
    this.sprites = newSprites;
    this.stateRevision++;
    this.emitter.emit('spritesChange', this.sprites);
  }

  public setActiveSpriteId(id: string): void {
    if (this.sprites.find((s) => s.id === id)) {
      this.activeSpriteId = id;
      this.emitter.emit('activeSpriteChange', id);
    }
  }

  public syncSprites(): void {
    this.emitter.emit('spritesChange', this.sprites);
  }
}
