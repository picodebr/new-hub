/**
 * useHistory - Hook para gestão de histórico (Undo/Redo) no Editor de Pintura.
 *
 * Responsabilidade: Abstrair o uso do `HistoryManager`, fornecendo estado
 * reativo (`canUndo`, `canRedo`) e funções de controle para a interface.
 * Utiliza refs para manter a sincronização com o escopo do Paper.js sem
 * disparar renderizações desnecessárias.
 *
 * Operações Principais:
 * - Inicialização do `HistoryManager` vinculado ao escopo do Paper.js.
 * - Exposição de funções: `saveHistory`, `undo`, `redo`, `setInitialState`.
 * - Fornecimento de flags de estado: `canUndo`, `canRedo`.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type * as paper from 'paper';

import { HistoryManager } from '../core/HistoryManager';

export function useHistory(scope: paper.PaperScope | null, onSync: () => void) {
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // Usa refs para manter referências estáveis e evitar re-renderizações em cascata
    const onSyncRef = useRef(onSync);
    useEffect(() => { onSyncRef.current = onSync; }, [onSync]);

    const managerRef = useRef<HistoryManager | null>(null);

    const updateStatus = useCallback(() => {
        if (managerRef.current) {
            setCanUndo(managerRef.current.canUndo());
            setCanRedo(managerRef.current.canRedo());
        }
    }, []);

    // Cria HistoryManager uma vez quando o escopo está pronto
    useEffect(() => {
        if (!scope) return;
        managerRef.current = new HistoryManager(scope, () => onSyncRef.current());
        updateStatus();
        return () => { managerRef.current = null; };
    }, [scope, updateStatus]);

    const saveHistory = useCallback(() => {
        managerRef.current?.saveHistory();
        updateStatus();
    }, [updateStatus]);

    const undo = useCallback(() => {
        managerRef.current?.undo();
        updateStatus();
    }, [updateStatus]);

    const redo = useCallback(() => {
        managerRef.current?.redo();
        updateStatus();
    }, [updateStatus]);

    const setInitialState = useCallback(() => {
        managerRef.current?.setInitialState();
        updateStatus();
    }, [updateStatus]);

    return { saveHistory, setInitialState, undo, redo, canUndo, canRedo };
}
