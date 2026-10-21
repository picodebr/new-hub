/**
 * ProjectService - Fachada Singleton para gestão do estado e ciclo de vida do projeto.
 *
 * Responsabilidade: Orquestrar todas as operações de alto nível sobre o projeto,
 * servindo como ponto único de entrada para a UI. Delega lógica específica para
 * sub-serviços especializados e notifica observadores via EventEmitter.
 *
 * Operações Principais:
 * - Gestão centralizada de Sprites, Fantasias (Costumes) e Cenários (Backdrops).
 * - Sincronização de variáveis e código entre workspaces Blockly.
 * - Seleção e atualização de estado ativo (Sprite/Cenário selecionado).
 *
 * Dependências: SpriteService, CostumeService, BackdropService, VariableService
 * e lib/EventEmitter para propagação de mudanças.
 */
import { SpriteData, BackdropData, IBlocklyWorkspaceJson, SpriteVariable, SpriteList, ProjectEvents } from '@/_base/domain/entities';
import { EventEmitter } from '../../lib/EventEmitter';
import { SpriteService } from './SpriteService';
import { CostumeService } from './CostumeService';
import { BackdropService } from './BackdropService';
import { VariableService } from './VariableService';
import { SoundService } from './SoundService';

export class ProjectService extends EventEmitter<ProjectEvents> {
  private spriteService: SpriteService;
  private costumeService: CostumeService;
  private backdropService: BackdropService;
  private variableService: VariableService;
  private soundService: SoundService;
  private broadcastMessages: string[] = ['mensagem1'];

  // Construtor é chamado apenas no getProjectService (Singleton)
  constructor() {
    super();
    this.spriteService = new SpriteService(this);
    this.costumeService = new CostumeService(this);
    this.backdropService = new BackdropService(this);
    this.variableService = new VariableService(this);
    this.soundService = new SoundService(this);
  }

  // ==========================================
  // DELEGAÇÃO: SPRITES
  // ==========================================

  public getSprites(): SpriteData[] {
    return this.spriteService.getSprites();
  }

  public getStateRevision(): number {
    return this.spriteService.getStateRevision();
  }

  // Para uso interno em alguns lugares
  public get sprites(): SpriteData[] {
    return this.spriteService.getSprites();
  }

  public get activeSpriteId(): string {
    return this.spriteService.getActiveSpriteId();
  }
  public set activeSpriteId(id: string) {
    this.spriteService.setActiveSpriteId(id);
  }

  public getActiveSprite(): SpriteData {
    const id = this.spriteService.getActiveSpriteId();
    const sprite = this.getSpriteById(id);
    return sprite || this.spriteService.getActiveSprite();
  }

  public getSpriteById(id: string): SpriteData | undefined {
    return this.spriteService.getSpriteById(id, this.backdropService.getActiveBackdropId(), this.backdropService.getBackdrops());
  }

  public async addSprite(file?: File): Promise<void> {
    return this.spriteService.addSprite(file);
  }

  public async addSpriteFromLibrary(
    name: string,
    url: string,
    costumes?: { name: string; url: string }[],
    sounds?: { name: string; url: string; format: 'wav' | 'mp3' }[],
  ): Promise<void> {
    return this.spriteService.addSpriteFromLibrary(name, url, costumes, sounds);
  }

  public async addSurpriseSprite(): Promise<void> {
    return this.spriteService.addSurpriseSprite();
  }

  public deleteSprite(id: string): void {
    this.spriteService.deleteSprite(id);
  }

  public selectSprite(id: string): void {
    this.spriteService.selectSprite(id);
    if (id === 'stage') {
      this.emit('activeSpriteChange', 'stage');
    }
  }

  /**
   * Atualiza as propriedades de um ator e dispara eventos de mudança.
   * O padrão de EventEmitter garante que tanto a UI (React) quanto os
   * monitores de execução reajam à mudança de estado.
   */
  public updateSprite(id: string, changes: Partial<SpriteData>, silent: boolean = false): void {
    this.spriteService.updateSprite(id, changes, (backdropId: string) => this.backdropService.switchBackdrop(backdropId), silent);
  }

  public updateSpriteBlocks(id: string, blocks: IBlocklyWorkspaceJson, code: string, variables?: SpriteVariable[]): void {
    this.spriteService.updateSpriteBlocks(id, blocks, code, variables);
  }

  public getStageBlocks(): { blocks: IBlocklyWorkspaceJson | undefined; code: string } {
    return this.spriteService.getStageBlocks();
  }

  public setSprites(newSprites: SpriteData[]): void {
    this.spriteService.setSprites(newSprites);
  }

  public duplicateSprite(id: string): SpriteData | undefined {
    return this.spriteService.duplicateSprite(id);
  }

  public createClone(id: string): SpriteData | undefined {
    return this.spriteService.createClone(id);
  }

  public clearClones(): void {
    this.spriteService.clearClones();
  }

  public syncSprites(): void {
    this.spriteService.syncSprites();
  }

  // ==========================================
  // DELEGAÇÃO: FANTASIAS (COSTUMES)
  // ==========================================

  public async addCostumeToSprite(spriteId: string, file?: File): Promise<void> {
    const result = await this.costumeService.addCostumeToSprite(spriteId, this.spriteService.getSprites(), file, (f) =>
      this.backdropService.addBackdrop(f),
    );
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
    return result;
  }

  public updateCostume(spriteId: string, costumeId: string, thumbnailUrl: string, stageUrl?: string): void {
    this.costumeService.updateCostume(
      spriteId,
      costumeId,
      thumbnailUrl,
      stageUrl,
      this.spriteService.getSprites(),
      this.backdropService.getBackdrops(),
      this.backdropService.getActiveBackdropId(),
    );
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  public updateCostumeThumbnail(spriteId: string, costumeId: string, thumbnailUrl: string, stageUrl?: string): void {
    this.costumeService.updateCostumeThumbnail(
      spriteId,
      costumeId,
      thumbnailUrl,
      stageUrl,
      this.spriteService.getSprites(),
      this.backdropService.getBackdrops(),
    );
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  public renameCostume(spriteId: string, costumeId: string, newName: string): void {
    this.costumeService.renameCostume(spriteId, costumeId, newName, this.spriteService.getSprites());
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  public renameBackdrop(backdropId: string, newName: string): void {
    this.backdropService.renameBackdrop(backdropId, newName);
    this.spriteService.bumpRevision();
  }

  public switchCostume(spriteId: string, costumeId: string): void {
    this.costumeService.switchCostume(spriteId, costumeId, this.spriteService.getSprites(), (bId) => this.backdropService.selectBackdrop(bId));
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  public removeCostumeFromSprite(spriteId: string, costumeId: string): void {
    this.costumeService.removeCostumeFromSprite(spriteId, costumeId, this.spriteService.getSprites(), (bId) =>
      this.backdropService.deleteBackdrop(bId),
    );
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  public duplicateCostume(spriteId: string, costumeId: string): void {
    if (spriteId === 'stage') {
      this.backdropService.duplicateBackdrop(costumeId);
    } else {
      this.costumeService.duplicateCostume(spriteId, costumeId, this.spriteService.getSprites());
    }
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  // ==========================================
  // DELEGAÇÃO: SONS (SOUNDS)
  // ==========================================

  public async addSoundToSprite(spriteId: string, file?: File): Promise<void> {
    await this.soundService.addSoundToSprite(spriteId, this.spriteService.getSprites(), file);
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  public renameSound(spriteId: string, soundId: string, newName: string): void {
    this.soundService.renameSound(spriteId, soundId, newName, this.spriteService.getSprites());
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  public switchSound(spriteId: string, soundId: string): void {
    this.soundService.switchSound(spriteId, soundId, this.spriteService.getSprites());
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  public removeSoundFromSprite(spriteId: string, soundId: string): void {
    this.soundService.removeSoundFromSprite(spriteId, soundId, this.spriteService.getSprites());
    this.spriteService.syncAllClones();
    this.spriteService.bumpRevision();
  }

  /**
   * Atualiza o conteúdo binário de um som (aplicado após efeitos no SoundEditor).
   * Delega para SoundService ou BackdropService conforme o spriteId.
   */
  public async updateSoundData(spriteId: string, soundId: string, blob: Blob): Promise<void> {
    if (spriteId === 'stage') {
      await this.backdropService.updateSoundDataOnBackdrop(this.backdropService.getActiveBackdropId(), soundId, blob);
    } else {
      await this.soundService.updateSoundData(spriteId, soundId, blob, this.spriteService.getSprites());
      this.spriteService.syncAllClones();
    }
    this.spriteService.bumpRevision();
  }

  public async playSound(url: string, volume?: number): Promise<void> {
    await this.soundService.playSound(url, volume);
  }

  public async playSoundUntilDone(url: string, volume?: number): Promise<void> {
    await this.soundService.playSoundUntilDone(url, volume);
  }

  public stopAllSounds(): void {
    this.soundService.stopAllSounds();
  }

  // ==========================================
  // DELEGAÇÃO: CENÁRIOS (BACKDROPS)
  // ==========================================

  public get backdrops(): BackdropData[] {
    return this.backdropService.getBackdrops();
  }

  public get activeBackdropId(): string {
    return this.backdropService.getActiveBackdropId();
  }

  public get activeBackdrop(): BackdropData | undefined {
    return this.backdropService.getActiveBackdrop();
  }

  public async addBackdrop(file?: File): Promise<void> {
    await this.backdropService.addBackdrop(file);
    this.spriteService.bumpRevision();
  }

  public switchBackdrop(id: string): void {
    this.backdropService.switchBackdrop(id);
    this.spriteService.bumpRevision();
  }

  public deleteBackdrop(id: string): void {
    this.backdropService.deleteBackdrop(id);
    this.spriteService.bumpRevision();
  }

  public selectBackdrop(id: string): void {
    this.backdropService.selectBackdrop(id);
    this.spriteService.bumpRevision();
  }

  public async addBackdropFromLibrary(name: string, url: string): Promise<void> {
    await this.backdropService.addBackdropFromLibrary(name, url);
    this.spriteService.bumpRevision();
  }

  public async addSurpriseBackdrop(): Promise<void> {
    await this.backdropService.addSurpriseBackdrop();
    this.spriteService.bumpRevision();
  }

  // ==========================================
  // DELEGAÇÃO: SONS DO CENÁRIO (BACKDROP SOUNDS)
  // ==========================================

  public async addSoundToBackdrop(backdropId: string, file?: File): Promise<void> {
    await this.backdropService.addSoundToBackdrop(backdropId, file);
    this.spriteService.bumpRevision();
  }

  public renameSoundOnBackdrop(backdropId: string, soundId: string, newName: string): void {
    this.backdropService.renameSoundOnBackdrop(backdropId, soundId, newName);
    this.spriteService.bumpRevision();
  }

  public switchSoundOnBackdrop(backdropId: string, soundId: string): void {
    this.backdropService.switchSoundOnBackdrop(backdropId, soundId);
    this.spriteService.bumpRevision();
  }

  public removeSoundFromBackdrop(backdropId: string, soundId: string): void {
    this.backdropService.removeSoundFromBackdrop(backdropId, soundId);
    this.spriteService.bumpRevision();
  }

  // ==========================================
  // DELEGAÇÃO: VARIÁVEIS (VARIABLES)
  // ==========================================

  public get stageVariables(): SpriteVariable[] {
    return this.variableService.getUserVariables('stage');
  }

  public get uploadVariables(): SpriteVariable[] {
    return this.variableService.getUserVariables('upload');
  }

  public getActiveSpriteId(): string {
    return this.spriteService.getActiveSpriteId();
  }

  public setActiveSpriteId(id: string): void {
    this.spriteService.setActiveSpriteId(id);
  }

  public getBackdrops(): BackdropData[] {
    return this.backdropService.getBackdrops();
  }

  public getActiveBackdropId(): string {
    return this.backdropService.getActiveBackdropId();
  }

  public setActiveBackdropId(id: string): void {
    this.backdropService.setActiveBackdropId(id);
  }

  public setBackdrops(newBackdrops: BackdropData[]): void {
    this.backdropService.setBackdrops(newBackdrops);
  }

  public getVariables(mode: 'stage' | 'upload'): SpriteVariable[] {
    return this.variableService.getUserVariables(mode);
  }

  public getUserVariables(mode: 'stage' | 'upload', activeSpriteId?: string | null): SpriteVariable[] {
    return this.variableService.getUserVariables(mode, activeSpriteId);
  }

  public addVariable(mode: 'stage' | 'upload', name: string, type: string, scope?: 'global' | 'local', ownerId?: string): void {
    this.variableService.addVariable(mode, name, type, scope, ownerId);
    this.spriteService.bumpRevision();
  }

  public renameVariable(mode: 'stage' | 'upload', oldName: string, newName: string): void {
    this.variableService.renameVariable(mode, oldName, newName);
    this.spriteService.bumpRevision();
  }

  public deleteVariable(mode: 'stage' | 'upload', name: string): void {
    this.variableService.deleteVariable(mode, name);
    this.spriteService.bumpRevision();
  }

  public updateVariableInBlocks(name: string, value: string | number | boolean, mode: 'stage' | 'upload'): void {
    this.variableService.updateVariableInBlocks(name, value, mode);
  }

  public setStageVariables(vars: SpriteVariable[]): void {
    this.variableService.setStageVariables(vars);
  }

  public setUploadVariables(vars: SpriteVariable[]): void {
    this.variableService.setUploadVariables(vars);
  }

  public forceSyncVariables(): void {
    this.variableService.forceSyncVariables();
  }

  // ── LISTAS ────────────────────────────────────────────────

  public getLists(mode: 'stage' | 'upload'): SpriteList[] {
    return this.variableService.getUserLists(mode);
  }

  public getUserLists(mode: 'stage' | 'upload', activeSpriteId?: string | null): SpriteList[] {
    return this.variableService.getUserLists(mode, activeSpriteId);
  }

  public addList(mode: 'stage' | 'upload', name: string, scope?: 'global' | 'local', ownerId?: string): SpriteList | null {
    const list = this.variableService.addList(mode, name, scope, ownerId);
    this.spriteService.bumpRevision();
    return list;
  }

  public renameList(mode: 'stage' | 'upload', oldName: string, newName: string): void {
    this.variableService.renameList(mode, oldName, newName);
    this.spriteService.bumpRevision();
  }

  public deleteList(mode: 'stage' | 'upload', name: string): void {
    this.variableService.deleteList(mode, name);
    this.spriteService.bumpRevision();
  }

  public updateVariableValueById(mode: 'stage' | 'upload', id: string, value: string | number | boolean): void {
    this.variableService.updateVariableValueById(mode, id, value);
  }

  public updateListItemsById(mode: 'stage' | 'upload', id: string, items: any[]): void {
    this.variableService.updateListItemsById(mode, id, items);
  }

  public forceSyncLists(): void {
    this.variableService.forceSyncLists();
  }

  /**
   * Transmite uma mensagem global para todo o projeto.
   * Atua como a ponte de comunicação entre atores (sprites).
   */
  public broadcast(message: string): void {
    this.emit('broadcast', message);
  }

  public getBroadcastMessages(): string[] {
    return this.broadcastMessages;
  }

  public setBroadcastMessages(messages: string[]): void {
    this.broadcastMessages = messages;
  }

  public addBroadcastMessage(name: string): void {
    if (!this.broadcastMessages.includes(name)) {
      this.broadcastMessages.push(name);
      this.spriteService.bumpRevision();
    }
  }

  public reset(): void {
    this.spriteService = new SpriteService(this);
    this.costumeService = new CostumeService(this);
    this.backdropService = new BackdropService(this);
    this.variableService = new VariableService(this);
    this.soundService = new SoundService(this);
    this.broadcastMessages = ['mensagem1'];
    // Bump revision so the RAF heartbeat in ProjectContext detects the change
    this.spriteService.bumpRevision();
    this.emit('activeSpriteChange', this.spriteService.getActiveSpriteId());
    this.emit('activeBackdropChange', this.backdropService.getActiveBackdropId());
  }
}

// Exporta instância singleton do ProjectService
let projectServiceInstance: ProjectService | null = null;

export const getProjectService = (): ProjectService => {
  if (!projectServiceInstance) {
    projectServiceInstance = new ProjectService();
    if (typeof window !== 'undefined') {
      (window as unknown as { project: ProjectService }).project = projectServiceInstance;
    }
  }
  return projectServiceInstance;
};
