/**
 * ExecutionTask - Representa um script em execução ativa.
 */
export interface ExecutionTask {
    id: string;
    spriteId: string;
    origin: 'green-flag' | 'broadcast' | 'click' | 'ml' | 'clone' | 'key' | 'backdrop';
    message?: string;
    startTime: number;
}

/**
 * ExecutionEngineEvents - Mapa de eventos e seus respectivos payloads.
 */
export interface ExecutionEngineEvents {
    'task:start': ExecutionTask;
    'task:end': string;
    'engine:start': void;
    'engine:stop': void;
    'signal:emit': { name: string; payload?: any };
}
