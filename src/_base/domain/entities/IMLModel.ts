/**
 * Estruturas para os modelos de Machine Learning (TensorFlow.js).
 * Define como os modelos são carregados, suas classes e predições.
 */
export interface IMLModel {
    id: string;
    name: string;
    modelJsonUrl: string; // TFJS model
    modelBinUrl: string; // TFJS weights
    metadataUrl: string; // TFJS metadata
    labels: string[]; // Classes (ex: Maçã, Banana) - lidas do metadata.json
}

export interface IExtensionData {
    ia?: {
        activeStageModel: IMLModel | null;
        activeUploadModel: IMLModel | null;
    };
    [key: string]: unknown; // Allow for other extensions
}

export interface IMLPrediction {
    label: string;
    value: number;
}

export interface ITMModel {
    baseModel: {
        infer: (tensor: unknown, endpoint: string) => unknown;
    };
    customModel: {
        predict: (activation: unknown) => {
            dataSync: () => Float32Array | Int32Array | Uint8Array;
        };
    };
}
