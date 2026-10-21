/**
 * SoundService - Gestão de recursos de áudio (Sons).
 *
 * Responsabilidade: Administrar o repositório de sons de cada ator,
 * lidando com o carregamento de arquivos e metadados de áudio.
 */
import { SoundData, SpriteData } from '../../domain/entities';
import { EventEmitter } from '../../lib/EventEmitter';
import { BrowserFileSystem } from '../../adapters/BrowserFileSystem';
import { ProjectEvents } from '../../domain/entities';
import { getPresignedUrl, uploadFile } from '../upload';

export class SoundService {
  private emitter: EventEmitter<ProjectEvents>;
  private audioContext: AudioContext | null = null;
  private activeAudios: HTMLAudioElement[] = [];

  constructor(emitter: EventEmitter<ProjectEvents>) {
    this.emitter = emitter;
  }

  private async uploadToS3(file: File): Promise<string> {
    const { link, full_path } = await getPresignedUrl(file.type || 'audio/wav', `code-assets`, `public-read`);
    await uploadFile(link, file);
    return full_path;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private trackAudio(audio: HTMLAudioElement): void {
    this.activeAudios.push(audio);
    const remove = () => {
      this.activeAudios = this.activeAudios.filter((a) => a !== audio);
    };
    audio.addEventListener('ended', remove, { once: true });
    audio.addEventListener('error', remove, { once: true });
    audio.addEventListener('pause', remove, { once: true });
  }

  public async addSoundToSprite(spriteId: string, sprites: SpriteData[], file?: File | Blob): Promise<void> {
    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    let url = '';
    let name = '';
    let format: 'wav' | 'mp3' = 'wav';

    if (file) {
      let fileToUpload: File;

      if (file instanceof File) {
        name = file.name.split('.')[0];
        format = file.name.split('.').pop()?.toLowerCase() === 'mp3' ? 'mp3' : 'wav';
        fileToUpload = file;
      } else {
        // É um Blob de gravação
        name = `gravação${sprites[spriteIndex].sounds.length + 1}`;
        format = 'wav';
        fileToUpload = new File([file], `${name}.wav`, { type: 'audio/wav' });
      }

      // Upload direto para o S3
      url = await this.uploadToS3(fileToUpload);
    } else {
      // Som padrão (bipe curto ou silêncio) - Mantido local para não onerar o S3
      url = 'data:audio/wav;base64,UklGRigAAABXQVZFav7//v8BAAgAZGF0YQAAAAA=';
      name = `som${sprites[spriteIndex].sounds.length + 1}`;
    }

    const newSound: SoundData = {
      id: `sound${Date.now()}`,
      name: name,
      url: url,
      format: format,
    };

    // Extrair metadados (duração)
    try {
      const audio = new Audio(url);
      await new Promise((resolve) => {
        audio.onloadedmetadata = () => {
          newSound.duration = audio.duration;
          resolve(true);
        };
        audio.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('[SoundService] Erro ao carregar metadados do som:', e);
    }

    const updatedSprite = {
      ...sprites[spriteIndex],
      sounds: [...sprites[spriteIndex].sounds, newSound],
      currentSoundId: newSound.id,
    };

    sprites[spriteIndex] = updatedSprite;
    this.emitter.emit('spritesChange', sprites);
  }

  public renameSound(spriteId: string, soundId: string, newName: string, sprites: SpriteData[]): void {
    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    const sprite = sprites[spriteIndex];
    const soundIndex = sprite.sounds.findIndex((s) => s.id === soundId);
    if (soundIndex === -1) return;

    const updatedSounds = [...sprite.sounds];
    updatedSounds[soundIndex] = { ...updatedSounds[soundIndex], name: newName };

    sprites[spriteIndex] = { ...sprite, sounds: updatedSounds };
    this.emitter.emit('spritesChange', sprites);
  }

  public switchSound(spriteId: string, soundId: string, sprites: SpriteData[]): void {
    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    const sprite = sprites[spriteIndex];
    const sound = sprite.sounds.find((s) => s.id === soundId);
    if (sound) {
      sprites[spriteIndex] = {
        ...sprite,
        currentSoundId: sound.id,
      };
      this.emitter.emit('spritesChange', sprites);
    }
  }

  public removeSoundFromSprite(spriteId: string, soundId: string, sprites: SpriteData[]): void {
    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    const sprite = sprites[spriteIndex];
    const updatedSounds = sprite.sounds.filter((s) => s.id !== soundId);

    let currentSoundId = sprite.currentSoundId;
    if (currentSoundId === soundId) {
      currentSoundId = updatedSounds.length > 0 ? updatedSounds[0].id : null;
    }

    sprites[spriteIndex] = {
      ...sprite,
      sounds: updatedSounds,
      currentSoundId,
    };

    this.emitter.emit('spritesChange', sprites);
  }

  /**
   * Atualiza o conteúdo binário de um som existente (aplicado após efeitos).
   */
  public async updateSoundData(spriteId: string, soundId: string, blob: Blob, sprites: SpriteData[]): Promise<void> {
    const spriteIndex = sprites.findIndex((s) => s.id === spriteId);
    if (spriteIndex === -1) return;

    const sprite = sprites[spriteIndex];
    const soundIndex = sprite.sounds.findIndex((s) => s.id === soundId);
    if (soundIndex === -1) return;

    // Transforma o Blob em File e faz upload para o S3
    const soundName = sprite.sounds[soundIndex].name;
    const fileToUpload = new File([blob], `${soundName}-editado.wav`, { type: 'audio/wav' });
    const url = await this.uploadToS3(fileToUpload);

    const updatedSounds = [...sprite.sounds];
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
      console.warn('[SoundService] Erro ao carregar metadados do som atualizado:', e);
    }

    sprites[spriteIndex] = { ...sprite, sounds: updatedSounds };
    this.emitter.emit('spritesChange', sprites);
  }

  public async playSound(url: string, volume: number = 100): Promise<void> {
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume / 100));
    this.trackAudio(audio);
    await audio.play();
  }

  public async playSoundUntilDone(url: string, volume: number = 100): Promise<void> {
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume / 100));
    this.trackAudio(audio);
    return new Promise<void>((resolve) => {
      audio.addEventListener('ended', () => resolve(), { once: true });
      audio.addEventListener('error', () => resolve(), { once: true });
      audio.play().catch(() => resolve());
    });
  }

  public stopAllSounds(): void {
    const audios = [...this.activeAudios];
    this.activeAudios = [];
    audios.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
    });
  }

  public async getAudioBuffer(url: string): Promise<AudioBuffer> {
    const context = this.getAudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
  }
}
