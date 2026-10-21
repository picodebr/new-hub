/**
 * useTools - Hook para gestão das ferramentas de desenho no Editor de Pintura.
 *
 * Responsabilidade: Instanciar e gerenciar o ciclo de vida das ferramentas
 * baseadas no Paper.js (Seleção, Lápis, Borracha, Geometrias, etc). Coordena
 * qual ferramenta está ativa e faz o roteamento de eventos de estado e histórico.
 *
 * Operações Principais:
 * - Instanciação das classes de ferramentas (`SelectTool`, `PencilTool`, etc).
 * - Gestão da ferramenta ativa e função de ativação (`activateTool`).
 * - Sincronização de propriedades de ferramentas com o estado global do editor.
 * - Suporte a ferramentas específicas como Texto (`commitText`).
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import type * as paper from 'paper';

import { BaseTool, ToolState } from '../core/tools/BaseTool';
import { SelectTool } from '../core/tools/selection/SelectTool';
import { BrushTool } from '../core/tools/freehand/BrushTool';
import { EraserTool } from '../core/tools/freehand/EraserTool';
import { RectTool } from '../core/tools/shapes/RectTool';
import { CircleTool } from '../core/tools/shapes/CircleTool';
import { LineTool } from '../core/tools/shapes/LineTool';
import { BucketTool } from '../core/tools/shapes/BucketTool';
import { TextTool } from '../core/tools/TextTool';

export function useTools(
    scope: paper.PaperScope | null,
    state: ToolState,
    saveHistory: () => void,
    onShowTextInput: (point: paper.Point) => void
) {
    const [activeToolId, setActiveToolId] = useState('select');

    // Usa refs para manter referências estáveis - as ferramentas não serão recriadas quando estas mudarem
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    const saveHistoryRef = useRef(saveHistory);
    useEffect(() => { saveHistoryRef.current = saveHistory; }, [saveHistory]);

    const onShowTextInputRef = useRef(onShowTextInput);
    useEffect(() => { onShowTextInputRef.current = onShowTextInput; }, [onShowTextInput]);

    const toolsRef = useRef<Record<string, BaseTool> | null>(null);

    // Cria ferramentas UMA VEZ quando o escopo está pronto
    useEffect(() => {
        if (!scope) return;

        const getState = () => stateRef.current;
        const doSave = () => saveHistoryRef.current();
        const doShowText = (p: paper.Point) => onShowTextInputRef.current(p);

        toolsRef.current = {
            select: new SelectTool(scope, getState, doSave),
            pencil: new BrushTool(scope, getState, doSave),
            eraser: new EraserTool(scope, getState, doSave),
            rect: new RectTool(scope, getState, doSave),
            circle: new CircleTool(scope, getState, doSave),
            line: new LineTool(scope, getState, doSave),
            bucket: new BucketTool(scope, getState, doSave),
            text: new TextTool(scope, getState, doSave, doShowText),
        };

        // Ativa ferramenta padrão
        toolsRef.current.select.activate();

        return () => { toolsRef.current = null; };
    }, [scope]);

    const activateTool = useCallback((id: string) => {
        if (toolsRef.current && toolsRef.current[id]) {
            const prevTool = toolsRef.current[activeToolId];
            if (prevTool?.deactivate) prevTool.deactivate();
            toolsRef.current[id].activate();
            setActiveToolId(id);
        }
    }, [activeToolId]);

    const commitText = useCallback((text: string, point: paper.Point) => {
        const textTool = toolsRef.current?.text as TextTool | undefined;
        if (textTool) {
            textTool.commitText(text, point);
        }
    }, []);

    const notifyProjectChange = useCallback(() => {
        if (toolsRef.current && toolsRef.current[activeToolId]) {
            toolsRef.current[activeToolId].onProjectChange?.();
        }
    }, [activeToolId]);

    /**
     * Limpa o estado visual de seleção da ferramenta activa antes de trocar de costume.
     * Chama deactivate() + activate() na ferramenta actual para que highlight clones
     * e bounding box sejam destruídos/recriados limpos no novo contexto de desenho.
     */
    const clearSelectionForCostumeSwitch = useCallback(() => {
        if (!toolsRef.current) return;
        const tool = toolsRef.current[activeToolId];
        if (tool) {
            tool.deactivate();
            tool.activate();
        }
    }, [activeToolId]);

    return { activeToolId, activateTool, commitText, notifyProjectChange, clearSelectionForCostumeSwitch };
}
