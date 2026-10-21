/**
 * PiExecutionEngine - Orquestrador Central de Tarefas e Sinais.
 *
 * Este serviço é o "cérebro" da execução no PiCode. Ele rastreia cada script
 * rodando de forma independente, gerencia a propagação de mensagens (Broadcast)
 * e decide quando o projeto deve entrar em estado de Auto-Stop.
 */

import { ExecutionEngineEvents, ExecutionTask } from '@/_base/domain/entities';
import { EventEmitter } from '@/_base/lib/EventEmitter';

export class ExecutionEngine extends EventEmitter<ExecutionEngineEvents> {
  private tasks: Map<string, ExecutionTask> = new Map();
  private isRunning: boolean = false;
  private autoStopTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Inicia o motor globalmente.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.emit('engine:start', undefined);
  }

  /**
   * Pára o motor e cancela todas as tarefas.
   */
  public stop(): void {
    if (!this.isRunning && this.tasks.size === 0) return;
    this.isRunning = false;
    this.tasks.clear();
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }
    this.emit('engine:stop', undefined);
  }

  /**
   * Registra o início de uma nova tarefa (script).
   */
  public registerTask(spriteId: string, origin: ExecutionTask['origin'], message?: string): string {
    const id = `task_${Math.random().toString(36).substring(2, 9)}`;
    const task: ExecutionTask = {
      id,
      spriteId,
      origin,
      message,
      startTime: Date.now(),
    };

    this.tasks.set(id, task);

    // Se o motor não estava "rodando", mas uma tarefa começou, forçamos o início (ex: clique em bloco)
    if (!this.isRunning) {
      this.isRunning = true;
      this.emit('engine:start', undefined);
    }

    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }

    this.emit('task:start', task);
    return id;
  }

  /**
   * Finaliza uma tarefa específica.
   */
  public completeTask(taskId: string): void {
    if (this.tasks.has(taskId)) {
      this.tasks.delete(taskId);
      this.emit('task:end', taskId);

      // AUTO-STOP: Se não houver mais tarefas, aguarda um instante para ver se
      // novas tarefas (ex: correntes de broadcast) serão disparadas.
      if (this.tasks.size === 0 && this.isRunning) {
        this.scheduleAutoStop();
      }
    }
  }

  private scheduleAutoStop(): void {
    if (this.autoStopTimeout) clearTimeout(this.autoStopTimeout);

    // Buffer de 100ms para aguardar cadeias de eventos assíncronos.
    this.autoStopTimeout = setTimeout(() => {
      if (this.tasks.size === 0 && this.isRunning) {
        console.log('[PiExecutionEngine] Auto-Stop: Todas as tarefas concluídas.');
        this.stop();
      }
      this.autoStopTimeout = null;
    }, 100);
  }

  public getActiveTaskCount(): number {
    return this.tasks.size;
  }

  public isProjectRunning(): boolean {
    return this.isRunning;
  }

  public getTasksByOrigin(origin: ExecutionTask['origin']): ExecutionTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.origin === origin);
  }
}

// Singleton Instance
let engineInstance: ExecutionEngine | null = null;

export const getExecutionEngine = (): ExecutionEngine => {
  if (!engineInstance) {
    engineInstance = new ExecutionEngine();
    // Expõe no window para depuração técnica (opcional)
    if (typeof window !== 'undefined') {
      (window as any).__engine = engineInstance;
    }
  }
  return engineInstance;
};
