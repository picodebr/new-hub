import { WebGLRenderer } from './WebGLRenderer';
import { CollisionEngine } from './CollisionEngine';

let globalRenderer: WebGLRenderer | null = null;
let globalCollision: CollisionEngine | null = null;

export function initWebGL(canvas: HTMLCanvasElement) {
    if (!globalRenderer) {
        globalRenderer = new WebGLRenderer(canvas);
        globalCollision = new CollisionEngine(globalRenderer);
        globalRenderer.setCollisionEngine(globalCollision);
    } else {
        // Se o canvas mudou (ex: remontagem do componente), atualizamos o renderizador
        globalRenderer.updateCanvas(canvas);
    }
    return { renderer: globalRenderer, collision: globalCollision };
}

export function getWebGLRenderer() {
    return globalRenderer;
}

export function getCollisionEngine() {
    return globalCollision;
}
