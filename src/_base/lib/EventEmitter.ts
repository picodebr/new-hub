/**
 * EventEmitter - Classe Base para Emissão de Eventos.
 * 
 * Provê uma infraestrutura genérica e "typesafe" (tipagem segura) para que 
 * os serviços da aplicação possam emitir e escutar eventos customizados. 
 * É fundamental para a comunicação entre a lógica de serviços e os hooks de UI.
 */

type Listener<T = unknown> = (data: T) => void;

/**
 * Simples emissor de eventos para comunicação desacoplada entre módulos.
 */
export class EventEmitter<Events extends object> {
    private listeners: { [K in keyof Events]?: Listener<Events[K]>[] } = {};

    /**
     * Subscribe to an event
     * @param event Event name
     * @param listener Callback function
     */
    on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    /**
     * Unsubscribe from an event
     * @param event Event name
     * @param listener Callback function to remove
     */
    off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            this.listeners[event] = eventListeners.filter(l => l !== listener) as Listener<Events[K]>[];
        }
    }

    /**
     * Emit an event to all subscribers
     * @param event Event name
     * @param data Data to pass to listeners
     */
    public emit<K extends keyof Events>(event: K, data: Events[K]): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            (eventListeners as Listener<Events[K]>[]).forEach(listener => {
                try {
                    listener(data);
                } catch (e) {
                    console.error(`[EventEmitter] Error in listener for event '${String(event)}':`, e);
                }
            });
        }
    }

    /**
     * Remove all listeners (useful for cleanup)
     */
    removeAllListeners(): void {
        this.listeners = {};
    }
}
