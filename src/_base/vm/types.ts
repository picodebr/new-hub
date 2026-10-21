/**
 * PicoVM - Types & Interfaces
 *
 * Contrato entre a VM e o sistema de execução existente (useStageRunner).
 * A VM depende apenas desta interface, não de hooks React diretamente.
 */
import * as Blockly from 'blockly/core';
import { SpriteData, BackdropData, SensingState } from '../domain/entities';
import { IHardwareBoard } from '../domain/ports/IHardwareBoard';

// ─────────────────────────────────────────────────────────────
// Runner: todos os primitivos de sprite que a VM precisa chamar
// ─────────────────────────────────────────────────────────────
export interface VMRunnerMethods {
    // Motion
    move(steps: number, spriteId?: string): Promise<void>;
    turn(deg: number, spriteId?: string): Promise<void>;
    goTo(x: number, y: number, spriteId?: string): void;
    setX(x: number, spriteId?: string): Promise<void>;
    setY(y: number, spriteId?: string): Promise<void>;
    addX(dx: number, spriteId?: string): Promise<void>;
    addY(dy: number, spriteId?: string): Promise<void>;
    setAngle(deg: number, spriteId?: string): void;
    setRotationStyle(style: string, spriteId?: string): void;
    glide(secs: number, x: number, y: number, spriteId?: string): Promise<void>;
    bounceOnEdge(spriteId?: string): Promise<void>;
    goToMouse(spriteId?: string): Promise<void>;
    pointToMouse(spriteId?: string): Promise<void>;

    // Looks
    say(text: string | number, spriteId?: string): void;
    sayFor(text: string | number, secs: number, spriteId?: string): Promise<void>;
    think(text: string | number, spriteId?: string): void;
    thinkFor(text: string | number, secs: number, spriteId?: string): Promise<void>;
    switchCostume(idOrType: string, spriteId?: string): Promise<void>;
    setSize(size: number, spriteId?: string): Promise<void>;
    changeSize(delta: number, spriteId?: string): Promise<void>;
    show(spriteId?: string): Promise<void>;
    hide(spriteId?: string): Promise<void>;
    setEffect(effect: string, value: number, spriteId?: string): void;
    changeEffect(effect: string, delta: number, spriteId?: string): void;
    clearEffects(spriteId?: string): void;
    goToLayer(layer: 'front' | 'back', spriteId?: string): void;
    goForwardLayers(num: number, spriteId?: string): void;
    switchBackdrop(idOrType: string): Promise<void>;
    switchBackdropAndWait(idOrType: string): Promise<void>;

    // Sound
    playSound(name: string, spriteId?: string): Promise<void>;
    playSoundUntilDone(name: string, spriteId?: string): Promise<void>;
    stopAllSounds(): Promise<void>;
    setSoundEffect(effect: string, value: number, spriteId?: string): void;
    changeSoundEffect(effect: string, delta: number, spriteId?: string): void;
    clearSoundEffects(spriteId?: string): void;
    setVolume(vol: number, spriteId?: string): void;
    changeVolume(delta: number, spriteId?: string): void;
    getVolume(spriteId?: string): number;

    // Control / Events
    wait(secs: number): Promise<void>;
    broadcast(msg: string): Promise<void>;
    broadcastAndWait(msg: string): Promise<void>;
    createClone(targetId: string, callerSpriteId?: string): Promise<void>;
    deleteClone(targetId: string): Promise<void>;

    // Sensing
    getSensingState(): SensingState;
    isTouching(spriteId: string, target: string): boolean;
    touchingColor(hex: string, spriteId?: string): Promise<boolean>;
    colorTouchingColor(hex1: string, hex2: string, spriteId?: string): Promise<boolean>;
    getDistanceTo(spriteId: string, target: string): number;
    resetTimer(): void;
    askAndWait(question: string, spriteId?: string): Promise<string>;
    getSpriteProperty(target: string, prop: string): string | number;
    setDraggable(draggable: boolean, spriteId?: string): void;


    // State readers (needed by reporter blocks)
    getSprites(): SpriteData[];
    getBackdrops(): BackdropData[];
    getActiveBackdropId(): string;

    // Machine Learning
    openMLWindow(): void;
    closeMLWindow(): void;
    isIdentifiedClass(className: string): boolean;
    getIdentifiedClass(): string;
    getConfidence(className: string): number;

    // Monitors
    setMonitorVisible?(monitorId: string, label: string, visible: boolean): void;
    updateMonitorValue?(monitorId: string, value: string | number): void;
    updateMonitorItems?(monitorId: string, items: (string | number)[]): void;

    // Runtime lifecycle
    clearClones?(): void;

    // Debugging
    debugMode?: boolean;

    // Hardware board (null quando não conectado)
    board: IHardwareBoard | null;

    // State writers (sincroniza runtime VM de volta para o ProjectService)
    isUploadMode?: boolean;
    updateVariableValueById?(id: string, value: any): void;
    updateListItemsById?(id: string, items: any[]): void;
}

// ─────────────────────────────────────────────────────────────
// Callbacks de instrumentação (highlight, debug, scheduler)
// ─────────────────────────────────────────────────────────────
import { Thread } from './Thread';

export interface VMCallbacks {
    /** Chamado antes/depois de executar cada bloco (highlight visual) */
    highlight?: (blockId: string, on: boolean) => void;
    /** Chamado antes de cada bloco — pode awaitar para debug pause/step */
    beforeBlock?: (thread: Thread) => Promise<void>;
    /** Chamado após cada bloco — pode awaitar para scheduler (N steps/frame) */
    afterStep?: (forceYield?: boolean) => Promise<void>;
    /** Chamado pelo bloco control_stop para parar scripts */
    stopControl?: (option: string, thread: Thread) => void;
}

// ─────────────────────────────────────────────────────────────
// VM Configuration (injetada pelo hook React)
// ─────────────────────────────────────────────────────────────
export interface VMConfig {
    runner: VMRunnerMethods;
    getActiveWorkspace: () => Blockly.WorkspaceSvg | null;
    getActiveSpriteId: () => string;
    /** Callback global de highlight — PicoVM decide se o thread é do sprite ativo */
    onHighlight?: (blockId: string, on: boolean) => void;
}

// ─────────────────────────────────────────────────────────────
// Tipos de origem de execução
// ─────────────────────────────────────────────────────────────
export type VMOrigin = 'green-flag' | 'broadcast' | 'click' | 'key' | 'clone' | 'backdrop' | 'ml';
