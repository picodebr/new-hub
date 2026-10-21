import type { ProjectService } from '../../services/code/ProjectService';

/**
 * Interface estendida para o objeto Window, permitindo acesso tipado 
 * a callbacks e estados globais usados por bibliotecas externas e ML.
 */
export interface IGlobalWindow extends Window {
    activeMLModelLabels?: string[];
    activeUploadMLModelLabels?: string[];
    ml_labels?: {
        stage?: string[];
        upload?: string[];
    };
    project?: ProjectService;
    __p_setFillColor?: (color: string) => void;
    __p_setStrokeColor?: (color: string) => void;
    tf?: {
        loadLayersModel: (source: string | unknown) => Promise<unknown>;
        tidy: <T>(fn: () => T) => T;
        browser: {
            fromPixels: (element: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => unknown;
        };
        image: {
            resizeBilinear: (tensor: unknown, size: [number, number]) => unknown;
        };
        io: {
            fromMemory: (
                modelTopology: unknown,
                weightSpecs?: unknown,
                weightData?: ArrayBuffer,
            ) => unknown;
        };
    };
    mobilenet?: {
        load: () => Promise<{
            infer: (tensor: unknown, endpoint: string) => unknown;
        }>;
    };
}
