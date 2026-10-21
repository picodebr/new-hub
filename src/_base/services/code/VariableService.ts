/**
 * VariableService - Gestão de variáveis e listas com sincronismo de estado.
 *
 * Responsabilidade: Centralizar a definição e os valores de variáveis e listas
 * do usuário, garantindo consistência entre o modo Stage e Upload.
 *
 * Operações Principais:
 * - Variáveis: add/rename/delete/update, sincronização com Blockly
 * - Listas: add/rename/delete, operações de itens (adicionar, remover, etc.)
 */
import { SpriteVariable, SpriteList, VariableValue } from '@/_base/domain/entities';
import { EventEmitter } from '../../lib/EventEmitter';
import { ProjectEvents } from '@/_base/domain/entities';

export class VariableService {
  private stageVariables: SpriteVariable[] = [];
  private uploadVariables: SpriteVariable[] = [];
  private stageLists: SpriteList[] = [];
  private uploadLists: SpriteList[] = [];
  private emitter: EventEmitter<ProjectEvents>;

  constructor(emitter: EventEmitter<ProjectEvents>) {
    this.emitter = emitter;
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    this.stageVariables = [{ id: 'var1', name: 'minha variável', type: 'Number', value: 0, isGlobal: true }];
    this.uploadVariables = [{ id: 'var1', name: 'minha variável', type: 'Number', value: 0, isGlobal: true }];
    this.stageLists = [];
    this.uploadLists = [];
  }

  // ─────────────────────────────────────────────────────────
  // VARIÁVEIS
  // ─────────────────────────────────────────────────────────

  public getUserVariables(mode: 'stage' | 'upload', activeSpriteId?: string | null): SpriteVariable[] {
    const fullList = mode === 'upload' ? this.uploadVariables : this.stageVariables;
    if (!activeSpriteId) return fullList.filter((v) => v.isGlobal);
    return fullList.filter((v) => v.isGlobal || v.ownerId === activeSpriteId);
  }

  public addVariable(mode: 'stage' | 'upload', name: string, type: string, scope: 'global' | 'local' = 'global', ownerId?: string): void {
    const targetList = mode === 'upload' ? this.uploadVariables : this.stageVariables;
    if (!targetList.some((v) => v.name === name)) {
      const newVar: SpriteVariable = {
        id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name,
        type,
        value: type === 'Number' ? 0 : '',
        isGlobal: scope === 'global',
        ownerId: scope === 'local' ? ownerId : undefined,
        scope,
        visible: false,
      };
      targetList.push(newVar);
      this.emitVariablesChange(mode);
    }
  }

  public renameVariable(mode: 'stage' | 'upload', oldName: string, newName: string): void {
    const targetList = mode === 'upload' ? this.uploadVariables : this.stageVariables;
    const v = targetList.find((v) => v.name === oldName);
    if (v) {
      v.name = newName;
      this.emitVariablesChange(mode);
    }
  }

  public deleteVariable(mode: 'stage' | 'upload', name: string): void {
    if (mode === 'upload') {
      this.uploadVariables = this.uploadVariables.filter((v) => v.name !== name);
      this.emitVariablesChange('upload');
    } else {
      this.stageVariables = this.stageVariables.filter((v) => v.name !== name);
      this.emitVariablesChange('stage');
    }
  }

  public updateVariableInBlocks(name: string, value: VariableValue, mode: 'stage' | 'upload'): void {
    const targetList = mode === 'upload' ? this.uploadVariables : this.stageVariables;
    const v = targetList.find((x) => x.name === name);
    if (v) {
      v.value = value;
      this.emitVariablesChange(mode);
    }
  }

  public setStageVariables(vars: SpriteVariable[]): void {
    this.stageVariables = [...vars];
    this.emitVariablesChange('stage');
  }

  public setUploadVariables(vars: SpriteVariable[]): void {
    this.uploadVariables = [...vars];
    this.emitVariablesChange('upload');
  }

  public forceSyncVariables(): void {
    this.emitter.emit('stageVariablesChange', [...this.stageVariables]);
    this.emitter.emit('uploadVariablesChange', [...this.uploadVariables]);
  }

  // ─────────────────────────────────────────────────────────
  // LISTAS
  // ─────────────────────────────────────────────────────────

  public getUserLists(mode: 'stage' | 'upload', activeSpriteId?: string | null): SpriteList[] {
    const fullList = mode === 'upload' ? this.uploadLists : this.stageLists;
    if (!activeSpriteId) return fullList.filter((l) => l.isGlobal);
    return fullList.filter((l) => l.isGlobal || l.ownerId === activeSpriteId);
  }

  public addList(mode: 'stage' | 'upload', name: string, scope: 'global' | 'local' = 'global', ownerId?: string): SpriteList | null {
    const targetList = mode === 'upload' ? this.uploadLists : this.stageLists;
    if (targetList.some((l) => l.name === name)) return null;

    const newList: SpriteList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      items: [],
      isGlobal: scope === 'global',
      ownerId: scope === 'local' ? ownerId : undefined,
      visible: false,
    };
    targetList.push(newList);
    this.emitListsChange(mode);
    return newList;
  }

  public renameList(mode: 'stage' | 'upload', oldName: string, newName: string): void {
    const targetList = mode === 'upload' ? this.uploadLists : this.stageLists;
    const l = targetList.find((l) => l.name === oldName);
    if (l) {
      l.name = newName;
      this.emitListsChange(mode);
    }
  }

  public deleteList(mode: 'stage' | 'upload', name: string): void {
    if (mode === 'upload') {
      this.uploadLists = this.uploadLists.filter((l) => l.name !== name);
      this.emitListsChange('upload');
    } else {
      this.stageLists = this.stageLists.filter((l) => l.name !== name);
      this.emitListsChange('stage');
    }
  }

  public updateVariableValueById(mode: 'stage' | 'upload', id: string, value: VariableValue): void {
    const targetList = mode === 'upload' ? this.uploadVariables : this.stageVariables;
    const v = targetList.find((x) => x.id === id);
    if (v) {
      v.value = value;
      this.emitVariablesChange(mode);
    }
  }

  public updateListItemsById(mode: 'stage' | 'upload', id: string, items: any[]): void {
    const targetList = mode === 'upload' ? this.uploadLists : this.stageLists;
    const l = targetList.find((x) => x.id === id);
    if (l) {
      l.items = items;
      this.emitListsChange(mode);
    }
  }

  public forceSyncLists(): void {
    this.emitter.emit('stageListsChange', [...this.stageLists]);
    this.emitter.emit('uploadListsChange', [...this.uploadLists]);
  }

  // ─────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────

  private emitVariablesChange(mode: 'stage' | 'upload') {
    if (mode === 'upload') {
      this.emitter.emit('uploadVariablesChange', [...this.uploadVariables]);
    } else {
      this.emitter.emit('stageVariablesChange', [...this.stageVariables]);
    }
  }

  private emitListsChange(mode: 'stage' | 'upload') {
    if (mode === 'upload') {
      this.emitter.emit('uploadListsChange', [...this.uploadLists]);
    } else {
      this.emitter.emit('stageListsChange', [...this.stageLists]);
    }
  }
}
