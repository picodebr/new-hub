/**
 * PicoVM - Thread
 *
 * Representa um script em execução. Cada hat block ativo gera uma Thread.
 * O AbortController é o mecanismo central de cancelamento: quando `abort()`
 * é chamado, todos os `await` dentro do BlockInterpreter encerram graciosamente.
 */
export class Thread {
    readonly id: string;
    readonly spriteId: string;
    /** O ID do bloco que iniciou esta thread (usado para preempção/restart) */
    readonly targetBlockId?: string;

    /** Preenchido pelo PicoVM após registrar a tarefa no ExecutionEngine */
    taskId: string = '';

    /** O bloco sendo executado no momento (usado para restaurar highlight ao trocar de ator) */
    currentBlockId: string | null = null;

    /** Highlight callback — só preenchido para o sprite ativo (workspace visível) */
    highlight?: (blockId: string, on: boolean) => void;

    private _ac = new AbortController();

    constructor(spriteId: string, targetBlockId?: string) {
        this.id = `t_${Math.random().toString(36).substring(2, 9)}`;
        this.spriteId = spriteId;
        this.targetBlockId = targetBlockId;
    }

    get signal(): AbortSignal {
        return this._ac.signal;
    }

    get isAborted(): boolean {
        return this._ac.signal.aborted;
    }

    abort(): void {
        this._ac.abort();
    }
}
