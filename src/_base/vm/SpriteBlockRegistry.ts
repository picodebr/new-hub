/**
 * SpriteBlockRegistry — Equivalente ao target.blocks do Scratch.
 *
 * Mantém um Blockly.Workspace headless por sprite permanentemente em memória,
 * eliminando a necessidade de deserializar JSON a cada execução. O índice _hats
 * (opcode → blockIds) é reconstruído toda vez que um sprite é sincronizado,
 * tornando a busca por hat blocks O(1) em vez de O(todos os blocos).
 *
 * Ciclo de vida:
 *  - handleBlocklyEvents sincroniza o sprite ativo a cada edição.
 *  - greenFlag() sincroniza o sprite ativo do workspace visual e carrega
 *    os inativos de forma preguiçosa via sprite.blocks do ProjectService.
 *  - clearAll() é chamado quando um novo projeto é carregado.
 */
import * as Blockly from 'blockly/core';
import { IBlocklyWorkspaceJson } from '../domain/entities';

/** Tipos de bloco que podem iniciar um script (hat blocks). */
const HAT_OPCODES = new Set([
    'when_play_clicked',
    'event_when_key_pressed',
    'quando_receber',
    'when_sprite_clicked',
    'event_whenstageclicked',
    'control_start_as_clone',
    'event_when_backdrop_switches_to',
    'ml_when_predicted',
]);

export class SpriteBlockRegistry {
    /** workspace headless persistente por sprite */
    private _workspaces = new Map<string, Blockly.Workspace>();
    /** índice pré-computado: spriteId → opcode → blockIds */
    private _hats = new Map<string, Map<string, string[]>>();
    /** Cache do último JSON sincronizado para evitar recargas redundantes */
    private _lastJson = new Map<string, string>();

    // ── Escrita ────────────────────────────────────────────────

    /**
     * Carrega ou atualiza os blocos de um sprite a partir de JSON serializado.
     * Descarta o workspace anterior (se houver) e reconstrói o índice _hats.
     */
    syncFromJson(spriteId: string, json: IBlocklyWorkspaceJson): void {
        const jsonStr = JSON.stringify(json);
        if (this._lastJson.get(spriteId) === jsonStr) return;
        this._lastJson.set(spriteId, jsonStr);

        const existing = this._workspaces.get(spriteId);
        if (existing) existing.dispose();

        const ws = new Blockly.Workspace();
        const hasBlocks = (json.blocks?.blocks?.length ?? 0) > 0;
        if (hasBlocks) {
            try {
                Blockly.serialization.workspaces.load(json as unknown as object, ws);
            } catch (e) {
                console.warn('[SpriteBlockRegistry] Falha ao carregar blocos para', spriteId, e);
            }
        }

        this._workspaces.set(spriteId, ws);
        this._rebuildHatIndex(spriteId, ws);
    }

    /** Remove um sprite do registry e libera o workspace. */
    remove(spriteId: string): void {
        this._workspaces.get(spriteId)?.dispose();
        this._workspaces.delete(spriteId);
        this._hats.delete(spriteId);
        this._lastJson.delete(spriteId);
    }

    /** Limpa todo o registry (uso: projectLoaded). */
    clearAll(): void {
        for (const ws of this._workspaces.values()) ws.dispose();
        this._workspaces.clear();
        this._hats.clear();
        this._lastJson.clear();
    }

    // ── Leitura ────────────────────────────────────────────────

    /** Retorna true se o sprite já foi carregado no registry. */
    hasSprite(spriteId: string): boolean {
        return this._workspaces.has(spriteId);
    }

    /**
     * Retorna os hat blocks de um sprite para o opcode dado.
     * Usa o índice pré-computado → O(n° de hats desse opcode).
     */
    getHatBlocks(spriteId: string, opcode: string): Blockly.Block[] {
        const ws = this._workspaces.get(spriteId);
        if (!ws) return [];
        const ids = this._hats.get(spriteId)?.get(opcode) ?? [];
        return ids
            .map(id => ws.getBlockById(id))
            .filter((b): b is Blockly.Block => b !== null);
    }

    /** Retorna o workspace headless de um sprite. */
    getWorkspace(spriteId: string): Blockly.Workspace | undefined {
        return this._workspaces.get(spriteId);
    }

    /**
     * Variante filtrada: retorna hat blocks que satisfazem `predicate`.
     * Útil para broadcast (filtra por MENSAGEM) e key press (filtra por KEY_OPTION).
     */
    getHatBlocksFiltered(
        spriteId: string,
        opcode: string,
        predicate: (block: Blockly.Block) => boolean,
    ): Blockly.Block[] {
        return this.getHatBlocks(spriteId, opcode).filter(predicate);
    }

    // ── Internos ───────────────────────────────────────────────

    /**
     * Reconstrói o índice _hats escaneando apenas os top blocks.
     * Hat blocks são sempre top blocks em Blockly (sem previousConnection).
     */
    private _rebuildHatIndex(spriteId: string, ws: Blockly.Workspace): void {
        const index = new Map<string, string[]>();
        for (const block of ws.getTopBlocks(false)) {
            if (HAT_OPCODES.has(block.type)) {
                const list = index.get(block.type) ?? [];
                list.push(block.id);
                index.set(block.type, list);
            }
        }
        this._hats.set(spriteId, index);
    }
}

// ── Singleton ──────────────────────────────────────────────────

let _instance: SpriteBlockRegistry | null = null;

export function getSpriteBlockRegistry(): SpriteBlockRegistry {
    if (!_instance) _instance = new SpriteBlockRegistry();
    return _instance;
}
