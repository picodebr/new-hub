/**
 * BackdropService - Gestão de cenários e ambiente do palco.
 *
 * Responsabilidade: Controlar os fundos (backdrops) disponíveis no projeto,
 * gerenciando a transição entre diferentes cenários e a persistência de
 * suas propriedades.
 *
 * Operações Principais:
 * - addBackdrop: Inclusão de novos cenários via biblioteca ou arquivo local.
 * - switchBackdrop: Troca do cenário ativo no palco.
 * - selectBackdrop: Focagem no objeto "Palco" para edição de código global.
 *
 * Interações: Integrado ao ProjectService para refletir mudanças globais no palco.
 */
import { BackdropData, SoundData } from '../../domain/entities';
import { EventEmitter } from '../../lib/EventEmitter';
import { BrowserFileSystem } from '../../adapters/BrowserFileSystem';
import { ProjectEvents } from '../../domain/entities';

export class BackdropService {
  private backdrops: BackdropData[] = [];
  private activeBackdropId: string = '';
  private emitter: EventEmitter<ProjectEvents>;

  constructor(emitter: EventEmitter<ProjectEvents>) {
    this.emitter = emitter;
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    this.backdrops = [{ id: 'b1', name: 'Cenário 1', url: '/svg/Backdrops/vazio.svg', sounds: [], currentSoundId: null }];
    this.activeBackdropId = 'b1';
  }

  private emitChange(): void {
    this.emitter.emit('backdropChange', this.backdrops);
  }

  public getBackdrops(): BackdropData[] {
    return this.backdrops;
  }

  public getActiveBackdrop(): BackdropData | undefined {
    return this.backdrops.find((b) => b.id === this.activeBackdropId);
  }

  public getActiveBackdropId(): string {
    return this.activeBackdropId;
  }

  public setBackdrops(newBackdrops: BackdropData[]): void {
    this.backdrops = newBackdrops;
    this.emitter.emit('backdropChange', this.backdrops);
  }

  public setActiveBackdropId(id: string): void {
    this.selectBackdrop(id);
  }

  public async addBackdrop(file?: File): Promise<void> {
    const newId = `backdrop${Date.now()}`;
    let newBackdrop;

    if (file) {
      const url = await BrowserFileSystem.processFile(file, true);
      const name = file.name.split('.')[0];
      newBackdrop = { id: newId, name, url, sounds: [], currentSoundId: null };
    } else {
      newBackdrop = {
        id: newId,
        name: `Cenário ${this.backdrops.length + 1}`,
        url: '/svg/Backdrops/vazio.svg',
        sounds: [],
        currentSoundId: null,
      };
    }

    this.backdrops = [...this.backdrops, newBackdrop];
    this.emitter.emit('backdropChange', this.backdrops);
    this.activeBackdropId = newId;
    this.emitter.emit('activeBackdropChange', newId);

    // Ativa o palco após adicionar cenário para edição imediata
    this.emitter.emit('activeSpriteChange', 'stage');
  }

  public switchBackdrop(idOrType: string): void {
    if (!idOrType) return;

    let targetId = idOrType;
    const type = idOrType.toUpperCase();

    if (type === 'NEXT') {
      const currentIndex = this.backdrops.findIndex((b) => b.id === this.activeBackdropId);
      const nextIndex = (currentIndex + 1) % this.backdrops.length;
      targetId = this.backdrops[nextIndex].id;
    } else if (type === 'PREVIOUS' || type === 'PREV') {
      const currentIndex = this.backdrops.findIndex((b) => b.id === this.activeBackdropId);
      const nextIndex = (currentIndex - 1 + this.backdrops.length) % this.backdrops.length;
      targetId = this.backdrops[nextIndex].id;
    } else if (type === 'RANDOM') {
      const nextIndex = Math.floor(Math.random() * this.backdrops.length);
      targetId = this.backdrops[nextIndex].id;
    }

    const bd = this.backdrops.find((b) => b.id === targetId) || this.backdrops.find((b) => b.name === targetId);

    if (bd) {
      this.activeBackdropId = bd.id;
      this.emitter.emit('activeBackdropChange', bd.id);
    }
  }

  public deleteBackdrop(id: string): void {
    if (this.backdrops.length <= 1) {
      console.warn('[BackdropService] Não é possível deletar o último cenário');
      return;
    }

    this.backdrops = this.backdrops.filter((b) => b.id !== id);

    if (this.activeBackdropId === id) {
      this.activeBackdropId = this.backdrops[0].id;
      this.emitter.emit('activeBackdropChange', this.activeBackdropId);
    }

    this.emitter.emit('backdropChange', this.backdrops);
  }

  public selectBackdrop(id: string): void {
    if (this.backdrops.find((b) => b.id === id)) {
      this.activeBackdropId = id;
      this.emitter.emit('activeBackdropChange', id);
    }
  }

  public async addBackdropFromLibrary(name: string, url: string): Promise<void> {
    const newId = `backdrop${Date.now()}`;
    const newBackdrop = { id: newId, name, url, sounds: [], currentSoundId: null };

    this.backdrops = [...this.backdrops, newBackdrop];
    this.emitter.emit('backdropChange', this.backdrops);
    this.activeBackdropId = newId;
    this.emitter.emit('activeBackdropChange', newId);
    this.emitter.emit('activeSpriteChange', 'stage');
  }

  public async addSurpriseBackdrop(): Promise<void> {
    const libraryService = (await import('./LibraryService')).getLibraryService();
    const backdropsLib = await libraryService.getBackdrops();

    if (backdropsLib.length > 0) {
      const randomBd = backdropsLib[Math.floor(Math.random() * backdropsLib.length)];
      await this.addBackdropFromLibrary(randomBd.name, randomBd.url);
    } else {
      await this.addBackdrop();
    }
  }

  // ── Métodos de som por cenário ──────────────────────────────────────

  public async addSoundToBackdrop(backdropId: string, file?: File | Blob): Promise<void> {
    const idx = this.backdrops.findIndex((b) => b.id === backdropId);
    if (idx === -1) return;

    const backdrop = this.backdrops[idx];
    let url = '';
    let name = '';
    let format: 'wav' | 'mp3' = 'wav';

    if (file) {
      url = await BrowserFileSystem.readFileAsDataURL(file as File);
      if (file instanceof File) {
        name = file.name.split('.')[0];
        format = file.name.split('.').pop()?.toLowerCase() === 'mp3' ? 'mp3' : 'wav';
      } else {
        name = `gravação${backdrop.sounds.length + 1}`;
      }
    } else {
      url = 'data:audio/wav;base64,UklGRigAAABXQVZFav7//v8BAAgAZGF0YQAAAAA=';
      name = `som${backdrop.sounds.length + 1}`;
    }

    const newSound: SoundData = { id: `sound${Date.now()}`, name, url, format };

    try {
      const audio = new Audio(url);
      await new Promise((resolve) => {
        audio.onloadedmetadata = () => {
          newSound.duration = audio.duration;
          resolve(true);
        };
        audio.onerror = () => resolve(false);
      });
    } catch {
      /* ignore */
    }

    this.backdrops[idx] = {
      ...backdrop,
      sounds: [...backdrop.sounds, newSound],
      currentSoundId: newSound.id,
    };
    this.emitChange();
  }

  public renameSoundOnBackdrop(backdropId: string, soundId: string, newName: string): void {
    const idx = this.backdrops.findIndex((b) => b.id === backdropId);
    if (idx === -1) return;
    const backdrop = this.backdrops[idx];
    const sounds = backdrop.sounds.map((s) => (s.id === soundId ? { ...s, name: newName } : s));
    this.backdrops[idx] = { ...backdrop, sounds };
    this.emitChange();
  }

  public switchSoundOnBackdrop(backdropId: string, soundId: string): void {
    const idx = this.backdrops.findIndex((b) => b.id === backdropId);
    if (idx === -1) return;
    if (!this.backdrops[idx].sounds.find((s) => s.id === soundId)) return;
    this.backdrops[idx] = { ...this.backdrops[idx], currentSoundId: soundId };
    this.emitChange();
  }

  public removeSoundFromBackdrop(backdropId: string, soundId: string): void {
    const idx = this.backdrops.findIndex((b) => b.id === backdropId);
    if (idx === -1) return;
    const backdrop = this.backdrops[idx];
    const sounds = backdrop.sounds.filter((s) => s.id !== soundId);
    const currentSoundId = backdrop.currentSoundId === soundId ? (sounds[0]?.id ?? null) : backdrop.currentSoundId;
    this.backdrops[idx] = { ...backdrop, sounds, currentSoundId };
    this.emitChange();
  }

  /**
   * Atualiza o conteúdo binário de um som do cenário (aplicado após efeitos).
   */
  public async updateSoundDataOnBackdrop(backdropId: string, soundId: string, blob: Blob): Promise<void> {
    const idx = this.backdrops.findIndex((b) => b.id === backdropId);
    if (idx === -1) return;

    const backdrop = this.backdrops[idx];
    const soundIndex = backdrop.sounds.findIndex((s) => s.id === soundId);
    if (soundIndex === -1) return;

    const url = await BrowserFileSystem.readFileAsDataURL(blob as File);

    const updatedSounds = [...backdrop.sounds];
    updatedSounds[soundIndex] = { ...updatedSounds[soundIndex], url };

    // Extrair metadados atualizados (duração)
    try {
      const audio = new Audio(url);
      await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 2000);
        audio.onloadedmetadata = () => {
          clearTimeout(timeout);
          updatedSounds[soundIndex].duration = audio.duration;
          resolve(true);
        };
        audio.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch (e) {
      console.warn('[BackdropService] Erro ao carregar metadados do som do cenário:', e);
    }

    this.backdrops[idx] = { ...backdrop, sounds: updatedSounds };
    this.emitChange();
  }

  public renameBackdrop(id: string, newName: string): void {
    const idx = this.backdrops.findIndex((b) => b.id === id);
    if (idx === -1) return;
    this.backdrops[idx] = { ...this.backdrops[idx], name: newName };
    this.emitChange();
  }

  public duplicateBackdrop(id: string): void {
    const backdrop = this.backdrops.find((b) => b.id === id);
    if (!backdrop) return;

    const newId = `backdrop${Date.now()}`;
    const newBackdrop = {
      ...backdrop,
      id: newId,
      name: `${backdrop.name} 2`,
      sounds: [...backdrop.sounds],
    };

    this.backdrops = [...this.backdrops, newBackdrop];
    this.activeBackdropId = newId;
    this.emitChange();
    this.emitter.emit('activeBackdropChange', newId);
    this.emitter.emit('activeSpriteChange', 'stage');
  }
}
