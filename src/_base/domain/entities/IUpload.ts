/**
 * IUpload - Definições para o Processo de Upload de Firmware.
 * 
 * Contém os tipos que descrevem as fases do upload (pronto, voando, sucesso, falha) 
 * e a estrutura de status que gerencia os logs e o feedback visual da animação.
 */

export type UploadPhase = 'ready' | 'flying' | 'success' | 'failure';

export interface UploadStatus {
    phase: UploadPhase;
    isUploading: boolean;
    logs: string;
    showRocket: boolean;
}

export const INITIAL_UPLOAD_STATUS: UploadStatus = {
    phase: 'ready',
    isUploading: false,
    logs: '',
    showRocket: false
};
