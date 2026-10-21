/**
 * HistoryManager - Gerenciador central de Undo/Redo para o Editor de Pintura.
 *
 * Responsabilidade: Capturar o estado do projeto Paper.js como JSON e
 * permitir o retorno a estados anteriores. Gerencia uma pilha limitada
 * de estados históricos, garantindo que camadas de UI (guias, highlights)
 * não sejam persistidas erroneamente no histórico.
 *
 * Operações Principais:
 * - `saveHistory`: Captura o estado atual do projeto (JSON), removendo temporariamente camadas visuais.
 * - `undo`/`redo`: Restaura estados anteriores ou posteriores da pilha.
 * - `restoreFromHistory`: Limpa o projeto e reabilita componentes a partir do JSON salvo.
 */
import type * as paper from 'paper';


export class HistoryManager {
    private history: string[] = [];
    private historyStep = -1;
    private maxHistory = 30;

    constructor(
        private scope: paper.PaperScope,
        private onSync: () => void
    ) { }

    setInitialState() {
        const project = this.scope.project;
        if (!project) return;

        const uiLayers = project.layers.filter(l => l.name === 'guides' || l.name === 'highlight' || l.name === 'ui');
        uiLayers.forEach(l => l.remove());

        const jsonState = project.exportJSON();
        const guides = uiLayers.find(l => l.name === 'guides');
        const highlight = uiLayers.find(l => l.name === 'highlight');
        const ui = uiLayers.find(l => l.name === 'ui');
        if (guides) project.insertLayer(0, guides);
        if (highlight) project.addLayer(highlight);
        if (ui) project.addLayer(ui);

        if (jsonState) {
            this.history = [jsonState];
            this.historyStep = 0;
        }
    }

    saveHistory() {
        const project = this.scope.project;
        if (!project) return;

        // Desativa temporariamente as camadas de UI para que não sejam salvas no histórico/JSON.
        // 'ui' também é excluído: contém BoundingBox e highlight clones que são estado visual
        // efêmero — salvar no snapshot causa reaparecerem com layout desatualizado no undo.
        const uiLayers = project.layers.filter(l => l.name === 'guides' || l.name === 'highlight' || l.name === 'ui');
        uiLayers.forEach(l => l.remove());

        const jsonState = project.exportJSON();

        // Restaura as camadas de UI imediatamente após a exportação - garantindo a ordem correta
        const guides = uiLayers.find(l => l.name === 'guides');
        const highlight = uiLayers.find(l => l.name === 'highlight');
        const ui = uiLayers.find(l => l.name === 'ui');
        if (guides) project.insertLayer(0, guides);
        if (highlight) project.addLayer(highlight);
        if (ui) project.addLayer(ui);

        if (jsonState) {
            // Se desenhar após um undo, apaga o futuro
            if (this.historyStep < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyStep + 1);
            }
            this.history.push(jsonState);
            this.historyStep++;
            if (this.history.length > this.maxHistory) {
                this.history.shift();
                this.historyStep--;
            }
        }
        // Sincronização assíncrona para manter a UI responsiva
        setTimeout(() => this.onSync(), 0);
    }

    private restoreFromHistory(json: string) {
        const project = this.scope.project;
        if (!project) return;

        // Preserva camadas de UI antes de limpar o projeto
        const uiLayers = project.layers.filter(l => l.name === 'guides' || l.name === 'highlight');
        uiLayers.forEach(l => l.remove()); // Destaca do projeto antes de limpar

        project.clear();
        project.importJSON(json);
        
        // Reconecta camadas de UI ao novo estado do projeto - garantindo a ordem correta
        const guides = uiLayers.find(l => l.name === 'guides');
        const highlight = uiLayers.find(l => l.name === 'highlight');
        if (guides) project.insertLayer(0, guides);
        if (highlight) project.addLayer(highlight);

        // Após restaurar, encontra as camadas pelo nome e ativa a camada de desenho (drawing)
        const dl = project.layers.find(l => l.name === 'drawing') || project.layers[0];
        if (dl) dl.activate();
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreFromHistory(this.history[this.historyStep]);
            setTimeout(() => this.onSync(), 0);
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreFromHistory(this.history[this.historyStep]);
            setTimeout(() => this.onSync(), 0);
        }
    }

    canUndo(): boolean {
        return this.historyStep > 0;
    }

    canRedo(): boolean {
        return this.historyStep < this.history.length - 1;
    }
}
