/**
 * PicoVM - Orquestrador Central da VM
 *
 * Equivalente ao scratch-vm: gerencia threads, variáveis globais e despacha
 * eventos (bandeira verde, teclas, broadcasts, cliques) para os threads corretos.
 *
 * Não é um hook React — é uma classe pura instanciada como singleton.
 * O hook `usePicoVM` é responsável por injetá-lo com dependências do React.
 */
import * as Blockly from 'blockly/core';
import { Thread } from './Thread';
import { BlockInterpreter } from './BlockInterpreter';
import { VMConfig, VMOrigin } from './types';
import { getSpriteBlockRegistry } from './SpriteBlockRegistry';
import { IBlocklyWorkspaceJson, SpriteData } from '../domain/entities';
import { EventEmitter } from '../lib/EventEmitter';
import { getProjectService } from '../services/code';
import { getExecutionEngine } from '../services/code/ExecutionEngine';

export class PicoVM extends EventEmitter<any> {
  constructor() {
    super();
  }
  private threads = new Map<string, Thread>();
  /** Mapa de variáveis por TargetID (spriteId ou 'stage') -> Map de varID -> Valor */
  private targetVariables = new Map<string, Map<string, unknown>>();
  /** Mapa de listas por TargetID -> Map de listID -> Array de itens */
  private targetLists = new Map<string, Map<string, unknown[]>>();
  private interpreter: BlockInterpreter | null = null;
  private config: VMConfig | null = null;

  // ── Debug state ───────────────────────────────────────────
  private _debugMode = false;
  private _isPaused = false;
  private _stepMode = false; // executa 1 bloco e pausa novamente
  private _pauseResolvers: Array<() => void> = [];

  // ── Scheduler state ───────────────────────────────────────
  /** Máximo de blocos executados por frame antes de ceder ao rAF (Scratch style ~40) */
  readonly MAX_STEPS_PER_FRAME = 40;
  private _frameSteps = 0;
  /**
   * Fila de continuações de threads aguardando o próximo frame.
   * Cada thread que chama _waitOneFrame() insere seu próprio resolver aqui.
   * Na próxima rAF, todos são retomados em ordem FIFO — round-robin por frame,
   * equivalente ao scheduler cooperativo do Scratch.
   */
  private _yieldResolvers: Array<() => void> = [];
  private _rafHandle: number | null = null;

  // ─────────────────────────────────────────────────────────
  // Configuração (chamada pelo hook React a cada render)
  // ─────────────────────────────────────────────────────────

  configure(config: VMConfig): void {
    const oldActiveId = this.config?.getActiveSpriteId();
    this.config = config;

    if (!this.interpreter) {
      // Cria o interpreter apenas na primeira vez
      this.interpreter = new BlockInterpreter(
        config.runner,
        {
          get: (targetId, varId) => this.getVariableValue(targetId, varId),
          set: (targetId, varId, value) => this.setVariableValue(targetId, varId, value),
        },
        {
          get: (targetId, listId) => this.getListValue(targetId, listId),
          set: (targetId, listId, items) => this.setListValue(targetId, listId, items),
        },
      );

      // Limpa o registry quando um novo projeto é carregado,
      // garantindo que blocos antigos não vazem entre projetos.
      getProjectService().on('projectLoaded', () => getSpriteBlockRegistry().clearAll());
    } else {
      // Atualiza só o runner, sem recriar o BlockInterpreter
      this.interpreter.runner = config.runner;
    }
    this._updateInterpreterCallbacks();

    // Se mudou o ator ativo, restaura os glows dos blocos que estão rodando
    if (oldActiveId !== config.getActiveSpriteId()) {
      this._refreshActiveHighlights();
    }
  }

  /** Restaura o brilho (glow) de todos os blocos ativos no ator selecionado */
  private _refreshActiveHighlights(): void {
    const config = this.config;
    if (!config || !config.onHighlight) return;
    const activeId = config.getActiveSpriteId();

    for (const thread of this.threads.values()) {
      if (thread.spriteId === activeId && thread.currentBlockId) {
        config.onHighlight(thread.currentBlockId, true);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // Debug API
  // ─────────────────────────────────────────────────────────

  get debugMode(): boolean {
    return this._debugMode;
  }
  get isPaused(): boolean {
    return this._isPaused;
  }

  enableDebug(): void {
    this._debugMode = true;
    this._updateInterpreterCallbacks();
  }

  disableDebug(): void {
    this._debugMode = false;
    this._isPaused = false;
    this._stepMode = false;
    this._resolveAllPause();
    this._updateInterpreterCallbacks();
  }

  pause(): void {
    if (!this._debugMode) return;
    this._isPaused = true;
  }

  resume(): void {
    this._isPaused = false;
    this._stepMode = false;
    this._resolveAllPause();
  }

  /** Executa exatamente um bloco em todos os threads e pausa novamente */
  step(): void {
    if (!this._isPaused) return;
    this._stepMode = true;
    this._isPaused = false;
    this._resolveAllPause();
  }

  private _resolveAllPause(): void {
    const resolvers = this._pauseResolvers.splice(0);
    resolvers.forEach((r) => r());
  }

  private async _waitIfPaused(thread: Thread): Promise<void> {
    while (this._isPaused && !thread.isAborted) {
      await new Promise<void>((resolve) => this._pauseResolvers.push(resolve));
    }
    // Se estamos em step mode, re-pausa após deixar o bloco executar
    if (this._stepMode) {
      this._stepMode = false;
      this._isPaused = true;
    }
  }

  // ─────────────────────────────────────────────────────────
  // Scheduler
  // ─────────────────────────────────────────────────────────

  private async _consumeStep(forceWait: boolean = false): Promise<void> {
    this._frameSteps++;
    if (forceWait || this._frameSteps >= this.MAX_STEPS_PER_FRAME) {
      await this._waitOneFrame();
    }
  }

  /**
   * Suspende a thread atual até o próximo frame de animação.
   *
   * Cada thread insere seu próprio resolver na fila _yieldResolvers.
   * Quando o rAF dispara, TODOS os resolvers são chamados em ordem FIFO:
   * Thread A roda até seu próximo yield → Thread B roda até seu próximo yield → ...
   * Isso garante round-robin por frame — equivalente ao scheduler do Scratch.
   */
  private _waitOneFrame(): Promise<void> {
    return new Promise<void>((resolve) => {
      this._yieldResolvers.push(resolve);
      this._scheduleRaf();
    });
  }

  private _scheduleRaf(): void {
    if (this._rafHandle !== null) return;
    this._rafHandle = requestAnimationFrame(() => {
      this._rafHandle = null;
      this._resetFrameBudget();
      // Retoma todas as threads em ordem de registro (FIFO round-robin)
      const resolvers = this._yieldResolvers.splice(0);
      resolvers.forEach((r) => r());
    });
  }

  private _resetFrameBudget(): void {
    this._frameSteps = 0;
  }

  // ─────────────────────────────────────────────────────────
  // Atualiza callbacks do BlockInterpreter
  // ─────────────────────────────────────────────────────────

  private _updateInterpreterCallbacks(): void {
    if (!this.interpreter) return;
    this.interpreter.callbacks = {
      afterStep: (force) => this._consumeStep(force),
      beforeBlock: this._debugMode ? (thread) => this._waitIfPaused(thread) : undefined,
      // highlight é injetado por thread no _spawnThread
      stopControl: (option, thread) => this._handleStopControl(option, thread),
    };
  }

  private _handleStopControl(option: string, thread: Thread): void {
    if (option === 'all') {
      this.stopAll(true);
    } else if (option === 'this script') {
      thread.abort();
    } else if (option === 'other scripts in sprite') {
      for (const t of this.threads.values()) {
        if (t.spriteId === thread.spriteId && t.id !== thread.id) {
          t.abort();
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // API pública
  // ─────────────────────────────────────────────────────────

  /** Inicia todos os scripts "Quando bandeira verde for clicada" */
  greenFlag(): void {
    if (!this.config) return;

    this.stopAll(false);
    getExecutionEngine().start();

    const { runner, getActiveWorkspace, getActiveSpriteId } = this.config;
    const sprites = runner.getSprites();
    const activeWs = getActiveWorkspace();

    this.resetVariables();
    sprites.forEach((s) => this._initializeTargetVariables(s));
    if (activeWs) this._initializeFromWorkspace(activeWs);

    // Sincroniza o registry: sprite ativo do workspace visual (estado mais recente),
    // inativos por carga preguiçosa a partir do ProjectService.
    this._syncRegistry(sprites, getActiveSpriteId(), activeWs);

    const registry = getSpriteBlockRegistry();
    for (const sprite of sprites) {
      registry.getHatBlocks(sprite.id, 'when_play_clicked').forEach((hat) => this._spawnThread(sprite.id, hat, 'green-flag'));
    }
  }

  /** Para toda execução */
  stopAll(stopEngine = true): void {
    for (const thread of this.threads.values()) {
      thread.abort();
    }
    this.threads.clear();

    // Cancela o rAF pendente e libera todas as threads em espera
    if (this._rafHandle !== null) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
    // Resolve os resolvers pendentes para que as threads que estão em _waitOneFrame
    // possam terminar normalmente (o isAborted já foi setado acima via thread.abort()).
    const resolvers = this._yieldResolvers.splice(0);
    resolvers.forEach((r) => r());

    if (stopEngine) {
      this.config?.runner?.clearClones?.();
      getExecutionEngine().stop();
    }
  }

  /** Dispara scripts "Quando tecla X for pressionada" */
  triggerKeyPress(key: string): void {
    if (!this.config) return;
    const registry = getSpriteBlockRegistry();
    for (const sprite of this.config.runner.getSprites()) {
      registry
        .getHatBlocksFiltered(sprite.id, 'event_when_key_pressed', (b) => {
          const opt = b.getFieldValue('KEY_OPTION');
          return opt === 'any' || this._keyMatches(opt, key);
        })
        .forEach((hat) => this._spawnThread(sprite.id, hat, 'key'));
    }
  }

  /** Dispara scripts "Quando eu receber [mensagem]" */
  triggerBroadcast(message: string, wait: boolean = false): Promise<void> {
    if (!this.config) return Promise.resolve();
    const registry = getSpriteBlockRegistry();
    const promises: Promise<void>[] = [];

    for (const sprite of this.config.runner.getSprites()) {
      registry
        .getHatBlocksFiltered(sprite.id, 'quando_receber', (b) => b.getFieldValue('MENSAGEM') === message)
        .forEach((hat) => {
          const thread = this._spawnThread(sprite.id, hat, 'broadcast');
          if (wait) {
            promises.push(
              new Promise<void>((resolve) => {
                const onThreadEnd = (tid: string) => {
                  if (tid === thread.id) {
                    this.off('thread:end', onThreadEnd);
                    resolve();
                  }
                };
                this.on('thread:end', onThreadEnd);
              }),
            );
          }
        });
    }

    return wait ? Promise.all(promises).then(() => void 0) : Promise.resolve();
  }

  /** Dispara script de clique no ator */
  triggerSpriteClick(spriteId: string): void {
    if (!this.config) return;
    const sprite = this.config.runner.getSprites().find((s) => s.id === spriteId);
    if (!sprite) return;

    // Garante que o sprite está no registry (pode ser chamado antes do greenFlag)
    this._ensureInRegistry(sprite);

    const hatType = spriteId === 'stage' ? 'event_whenstageclicked' : 'when_sprite_clicked';
    getSpriteBlockRegistry()
      .getHatBlocks(spriteId, hatType)
      .forEach((hat) => this._spawnThread(spriteId, hat, 'click'));
  }

  /** Dispara scripts de clone */
  triggerCloneStart(spriteId: string, blocksJson: IBlocklyWorkspaceJson): void {
    if (this.config) {
      const sprite = this.config.runner.getSprites().find((s) => s.id === spriteId);
      if (sprite) {
        const parentId = sprite.parentId;
        const parentVars = parentId ? this.targetVariables.get(parentId) : null;
        const varMap = new Map<string, unknown>();
        if (parentVars) {
          for (const [id, val] of parentVars.entries()) varMap.set(id, val);
        } else {
          sprite.variables?.forEach((v) => varMap.set(v.id, v.value ?? 0));
        }
        this.targetVariables.set(spriteId, varMap);
      }
    }

    // O clone tem seu próprio workspace no registry (isolado do pai)
    getSpriteBlockRegistry().syncFromJson(spriteId, blocksJson);
    getSpriteBlockRegistry()
      .getHatBlocks(spriteId, 'control_start_as_clone')
      .forEach((hat) => this._spawnThread(spriteId, hat, 'clone'));
  }

  /** Dispara scripts "Quando o cenário mudar para [nome]" */
  triggerBackdropChange(backdropName: string): void {
    if (!this.config) return;
    const registry = getSpriteBlockRegistry();
    for (const sprite of this.config.runner.getSprites()) {
      registry
        .getHatBlocksFiltered(sprite.id, 'event_when_backdrop_switches_to', (b) => b.getFieldValue('BACKDROP') === backdropName)
        .forEach((hat) => this._spawnThread(sprite.id, hat, 'backdrop'));
    }
  }

  /** Dispara scripts "Quando [classe] for prevista" */
  triggerMLPrediction(label: string): void {
    if (!this.config) return;
    const registry = getSpriteBlockRegistry();
    for (const sprite of this.config.runner.getSprites()) {
      registry
        .getHatBlocksFiltered(sprite.id, 'ml_when_predicted', (b) => b.getFieldValue('CLASS') === label)
        .forEach((hat) => this._spawnThread(sprite.id, hat, 'ml'));
    }
  }

  // ─────────────────────────────────────────────────────────
  // Sincronização com o SpriteBlockRegistry
  // ─────────────────────────────────────────────────────────

  /**
   * Garante que todos os sprites estão carregados no registry.
   * O sprite ativo é sempre re-sincronizado do workspace visual (estado mais fresco).
   * Sprites inativos são carregados de forma preguiçosa do ProjectService.
   */
  private _syncRegistry(sprites: SpriteData[], activeId: string, activeWs: Blockly.WorkspaceSvg | Blockly.Workspace | null): void {
    const registry = getSpriteBlockRegistry();
    for (const sprite of sprites) {
      if (sprite.id === activeId && activeWs) {
        const json = Blockly.serialization.workspaces.save(activeWs) as unknown as IBlocklyWorkspaceJson;
        registry.syncFromJson(sprite.id, json);
      } else {
        this._ensureInRegistry(sprite);
      }
    }
  }

  /**
   * Carrega um sprite no registry se ainda não estiver presente.
   * Usa o workspace visual se for o sprite ativo, caso contrário sprite.blocks.
   */
  private _ensureInRegistry(sprite: SpriteData): void {
    const registry = getSpriteBlockRegistry();
    if (registry.hasSprite(sprite.id)) return;

    if (!this.config) return;
    const activeId = this.config.getActiveSpriteId();
    const activeWs = this.config.getActiveWorkspace();

    if (sprite.id === activeId && activeWs) {
      const json = Blockly.serialization.workspaces.save(activeWs) as unknown as IBlocklyWorkspaceJson;
      registry.syncFromJson(sprite.id, json);
    } else if (sprite.blocks) {
      registry.syncFromJson(sprite.id, sprite.blocks);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Spawning de thread individual
  // ─────────────────────────────────────────────────────────

  private _spawnThread(spriteId: string, hatBlock: Blockly.Block, origin: VMOrigin): Thread {
    if (!this.interpreter) throw new Error('[PicoVM] VM não configurada');

    // PREEMPÇÃO: Se já houver uma thread rodando para este mesmo bloco neste sprite,
    // nós a abortamos antes de iniciar a nova (Comportamento padrão do Scratch para eventos).
    const existingThreads = Array.from(this.threads.values());
    for (const existingThread of existingThreads) {
      if (existingThread.spriteId === spriteId && existingThread.targetBlockId === hatBlock.id) {
        existingThread.abort();
        this.threads.delete(existingThread.id);
      }
    }

    const engine = getExecutionEngine();
    const thread = new Thread(spriteId, hatBlock.id);

    // Proxy de highlight que respeita o estado ativo da interface
    thread.highlight = (id, on) => {
      const config = this.config;
      if (config && spriteId === config.getActiveSpriteId()) {
        config.onHighlight?.(id, on);
      }
    };

    // Mapeia origin para o tipo aceito pelo ExecutionEngine
    const engineOrigin = this._toEngineOrigin(origin);
    thread.taskId = engine.registerTask(spriteId, engineOrigin);
    this.threads.set(thread.id, thread);

    this._resetFrameBudget();

    // VISUAL FEEDBACK: O bloco de chapéu (evento) brilha enquanto o script rodar
    thread.currentBlockId = hatBlock.id;
    thread.highlight?.(hatBlock.id, true);

    const nextBlock = hatBlock.getNextBlock();
    const promise = nextBlock ? this.interpreter.executeStack(nextBlock, thread) : Promise.resolve();

    promise
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('[PicoVM] Erro no thread:', thread.id, err);
        }
      })
      .finally(() => {
        // Sinaliza conclusão via abort para que ouvintes (ex: ws.dispose em _startHatBlocksFromJson)
        // sejam notificados mesmo quando o thread termina normalmente (sem stopAll).
        thread.abort();
        thread.highlight?.(hatBlock.id, false);
        thread.currentBlockId = null;
        this.threads.delete(thread.id);
        engine.completeTask(thread.taskId);
        this.emit('thread:end', thread.id);
      });

    return thread;
  }

  // ─────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────

  private _keyMatches(option: string, key: string): boolean {
    if (option === key) return true;
    if (option.toLowerCase() === key.toLowerCase()) return true;
    if (option === 'space' && key === ' ') return true;
    if (option === 'up arrow' && key === 'ArrowUp') return true;
    if (option === 'down arrow' && key === 'ArrowDown') return true;
    if (option === 'right arrow' && key === 'ArrowRight') return true;
    if (option === 'left arrow' && key === 'ArrowLeft') return true;
    if (option === 'enter' && key === 'Enter') return true;
    return false;
  }

  private _toEngineOrigin(origin: VMOrigin): 'green-flag' | 'broadcast' | 'click' | 'ml' | 'clone' | 'key' | 'backdrop' {
    switch (origin) {
      case 'green-flag':
        return 'green-flag';
      case 'broadcast':
        return 'broadcast';
      case 'click':
        return 'click';
      case 'ml':
        return 'ml';
      case 'clone':
        return 'clone';
      case 'key':
        return 'key';
      case 'backdrop':
        return 'backdrop';
      default:
        return 'click';
    }
  }

  /**
   * Executa um bloco individual clicado no workspace.
   * Equivalente ao Scratch clicar num bloco solto — cria uma thread temporária.
   */
  runBlockById(blockId: string, spriteId: string, optWs?: Blockly.Workspace): void {
    if (!this.interpreter || !this.config) return;

    // Garante que o sprite está no registry (workspace headless) antes de tentar rodar.
    // Isso permite que o "Testar Bloco" funcione mesmo se a bandeira verde nunca foi clicada.
    const sprite = this.config.runner.getSprites().find((s) => s.id === spriteId);
    if (sprite) this._ensureInRegistry(sprite);

    const registry = getSpriteBlockRegistry();
    const ws = optWs || registry.getWorkspace(spriteId);
    if (!ws) return;

    // Inicializa variáveis e listas se o estado runtime estiver vazio.
    // Isso permite que "Testar Bloco" funcione com os dados atuais do projeto
    // mesmo sem ter clicado na bandeira verde.
    if (this.targetVariables.size === 0) {
      const sprites = this.config.runner.getSprites();
      sprites.forEach((s) => this._initializeTargetVariables(s));
      this._initializeFromWorkspace(ws);
    }

    const block = ws.getBlockById(blockId);
    if (!block) return;

    const engine = getExecutionEngine();
    engine.start();

    const thread = new Thread(spriteId, blockId);

    // PREEMPÇÃO para Teste de Bloco: se já estiver rodando este bloco, aborta o anterior.
    const existingThreads = Array.from(this.threads.values());
    for (const existingThread of existingThreads) {
      if (existingThread.spriteId === spriteId && existingThread.targetBlockId === blockId) {
        existingThread.abort();
        this.threads.delete(existingThread.id);
      }
    }

    if (this.config.onHighlight) thread.highlight = this.config.onHighlight;
    thread.taskId = engine.registerTask(spriteId, 'click');
    this.threads.set(thread.id, thread);
    this._resetFrameBudget();

    // Se for um bloco de chapéu, começamos pelo próximo.
    // Se for um bloco de comando comum ou reporter, começamos por ele mesmo.
    const isHat = !block.previousConnection && !block.outputConnection;
    const startBlock = isHat ? block.getNextBlock() : block;

    if (!startBlock) {
      // Se clicou num chapéu vazio, apenas pisca o chapéu
      if (isHat) {
        thread.highlight?.(blockId, true);
        setTimeout(() => thread.highlight?.(blockId, false), 100);
      }
      thread.abort();
      this.threads.delete(thread.id);
      engine.completeTask(thread.taskId);
      return;
    }

    thread.currentBlockId = block.id;
    thread.highlight?.(blockId, true);

    this.interpreter
      .executeStack(startBlock, thread)
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('[PicoVM] Erro no bloco clicado:', err);
        }
      })
      .finally(() => {
        thread.abort();
        thread.highlight?.(blockId, false);
        this.threads.delete(thread.id);
        engine.completeTask(thread.taskId);
      });
  }

  /** Número de threads ativos */
  get threadCount(): number {
    return this.threads.size;
  }

  /** Reseta todas as variáveis e listas de todos os targets */
  resetVariables(): void {
    this.targetVariables.clear();
    this.targetLists.clear();
  }

  /**
   * Busca valor de variável respeitando escopo (Local -> Global)
   * varId pode ser o ID do Blockly ou o Nome (fallback)
   */
  getVariableValue(targetId: string, varId: string): unknown {
    // 1. Tenta buscar no escopo local do sprite
    const localVars = this.targetVariables.get(targetId);
    if (localVars && localVars.has(varId)) {
      return localVars.get(varId);
    }

    // 2. Tenta buscar no escopo global (Palco)
    const globalVars = this.targetVariables.get('stage');
    if (globalVars && globalVars.has(varId)) {
      return globalVars.get(varId);
    }

    // 3. Fallback: se não encontrar por ID, tenta buscar por nome no escopo local
    // (Isso ajuda com blocos antigos que podem não ter IDs consistentes)
    if (localVars) {
      for (const [id, val] of localVars.entries()) {
        // Aqui precisaríamos de um mapeamento id -> nome, mas por enquanto retornamos 0
      }
    }

    return 0; // Valor padrão do Scratch para variáveis não encontradas
  }

  /** Define valor de variável no escopo correto */
  setVariableValue(targetId: string, varId: string, value: unknown): void {
    if (!this.config) return;

    // Se a variável existe localmente, atualiza localmente
    const localVars = this.targetVariables.get(targetId);
    if (localVars && localVars.has(varId)) {
      localVars.set(varId, value);
      this._updateMonitorIfExisting(targetId, varId, value);
      this.config.runner.updateVariableValueById?.(varId, value);
      return;
    }

    // Se a variável existe globalmente, atualiza globalmente
    const globalVars = this.targetVariables.get('stage');
    if (globalVars && globalVars.has(varId)) {
      globalVars.set(varId, value);
      this._updateMonitorIfExisting('stage', varId, value);
      this.config.runner.updateVariableValueById?.(varId, value);
      return;
    }

    // Se não existir em lugar nenhum, cria no escopo local por segurança (comportamento Scratch)
    let finalLocalVars = localVars;
    if (!finalLocalVars) {
      finalLocalVars = new Map<string, unknown>();
      this.targetVariables.set(targetId, finalLocalVars);
    }
    finalLocalVars.set(varId, value);
    this._updateMonitorIfExisting(targetId, varId, value);
    this.config.runner.updateVariableValueById?.(varId, value);
  }

  /**
   * Inicializa variáveis e listas a partir do workspace Blockly ativo.
   * Necessário porque o VariableService armazena variáveis separado dos sprites.
   * Pré-popula o escopo global ('stage') com todas as variáveis do workspace.
   */
  private _initializeFromWorkspace(ws: Blockly.WorkspaceSvg | Blockly.Workspace): void {
    const allWsVars = ws.getVariableMap().getAllVariables();
    const stageVarMap = this.targetVariables.get('stage') ?? new Map<string, unknown>();
    const stageListMap = this.targetLists.get('stage') ?? new Map<string, unknown[]>();

    for (const wsVar of allWsVars) {
      const varType = (wsVar as unknown as { type: string }).type;
      const varId = wsVar.getId();
      if (!varId) continue;

      if (varType === 'list') {
        // Inicializa lista vazia se não existir ainda
        if (!stageListMap.has(varId)) {
          stageListMap.set(varId, []);
        }
      } else {
        // Inicializa variável com valor padrão por tipo se não existir
        if (!stageVarMap.has(varId)) {
          const defaultVal = varType === 'Number' ? 0 : '';
          stageVarMap.set(varId, defaultVal);
        }
        // Reseta o monitor para o valor inicial ao iniciar execução
        const currentVal = stageVarMap.get(varId);
        if (typeof currentVal === 'number' || typeof currentVal === 'string') {
          this._updateMonitorIfExisting('stage', varId, currentVal);
        }
      }
    }

    this.targetVariables.set('stage', stageVarMap);
    this.targetLists.set('stage', stageListMap);
  }

  private _initializeTargetVariables(sprite: SpriteData): void {
    const varMap = new Map<string, unknown>();
    if (sprite.variables) {
      sprite.variables.forEach((v) => {
        // Variáveis globais ficam somente no escopo 'stage' (_initializeFromWorkspace).
        // Adicioná-las ao escopo local causaria shadowing: atualizações de um sprite
        // não seriam visíveis para outros sprites que leram do próprio escopo local.
        if (v.isGlobal) return;
        const initialVal = v.value ?? 0;
        varMap.set(v.id, initialVal);
        this._updateMonitorIfExisting(sprite.id, v.id, initialVal);
      });
    }
    this.targetVariables.set(sprite.id, varMap);

    // Inicializa listas do sprite
    const listMap = new Map<string, unknown[]>();
    if (sprite.lists) {
      sprite.lists.forEach((l) => {
        listMap.set(l.id, [...(l.items ?? [])]);
      });
    }
    this.targetLists.set(sprite.id, listMap);
  }

  /** Busca valor de lista respeitando escopo (Local -> Global) */
  getListValue(targetId: string, listId: string): unknown[] {
    const localLists = this.targetLists.get(targetId);
    if (localLists && localLists.has(listId)) return localLists.get(listId)!;

    const globalLists = this.targetLists.get('stage');
    if (globalLists && globalLists.has(listId)) return globalLists.get(listId)!;

    return [];
  }

  /** Define valor de lista no escopo correto */
  setListValue(targetId: string, listId: string, items: unknown[]): void {
    if (!this.config) return;

    const localLists = this.targetLists.get(targetId);
    if (localLists && localLists.has(listId)) {
      localLists.set(listId, items);
      this._notifyListMonitor(listId, items);
      this.config.runner.updateListItemsById?.(listId, items);
      return;
    }

    const globalLists = this.targetLists.get('stage');
    if (globalLists && globalLists.has(listId)) {
      globalLists.set(listId, items);
      this._notifyListMonitor(listId, items);
      this.config.runner.updateListItemsById?.(listId, items);
      return;
    }

    let finalLocalLists = localLists;
    if (!finalLocalLists) {
      finalLocalLists = new Map<string, unknown[]>();
      this.targetLists.set(targetId, finalLocalLists);
    }
    finalLocalLists.set(listId, items);
    this._notifyListMonitor(listId, items);
    this.config.runner.updateListItemsById?.(listId, items);
  }

  /** Retorna os itens de uma lista (para polling externo, se necessário) */
  getListItems(targetId: string, listId: string): unknown[] {
    return this.getListValue(targetId, listId);
  }

  private _notifyListMonitor(listId: string, items: unknown[]): void {
    if (!this.config) return;
    const runner = this.config.runner as unknown as Record<string, unknown>;
    const fn = runner['updateMonitorItems'] as ((id: string, items: (string | number)[]) => void) | undefined;
    if (fn) {
      const safeItems = items.map((i) => (typeof i === 'number' || typeof i === 'string' ? i : String(i)));
      fn(`list_${listId}`, safeItems);
    }
  }

  private _updateMonitorIfExisting(targetId: string, varId: string, value: unknown): void {
    if (!this.config) return;
    // Notifica o sistema de monitores no ProjectContext (via runner se disponível)
    // O ID do monitor geralmente é var_ID
    const val = typeof value === 'number' || typeof value === 'string' ? value : String(value);
    this.config.runner.updateMonitorValue?.(`var_${varId}`, val);
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────
let _instance: PicoVM | null = null;

export function getPicoVM(): PicoVM {
  if (!_instance) {
    _instance = new PicoVM();
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__picovm = _instance;
      (window as unknown as Record<string, unknown>).__PICO_VM__ = _instance;
    }
  }
  return _instance;
}
