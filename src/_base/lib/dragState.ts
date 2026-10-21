/**
 * dragState - Singleton que rastreia qual sprite está sendo arrastado no palco.
 *
 * Usado por useStageRunner para ignorar atualizações de posição via scripts
 * enquanto o usuário estiver segurando um sprite (comportamento idêntico ao Scratch).
 */
export const dragState = {
    draggingId: null as string | null,
};
