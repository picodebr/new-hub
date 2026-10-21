/**
 * Orquestra o processo de gravação de firmware na placa.
 * Coordena a compilação, preparação da porta serial e execução do protocolo de flash.
 */

import { UploadStatus, INITIAL_UPLOAD_STATUS } from '../../domain/entities/IUpload';
import { CompilerService } from './CompilerService';
import { uploadFirmware } from '../../lib/stk500';
import { parseHexFile } from '../../lib/byteUtils';
import { EventEmitter } from '../../lib/EventEmitter';
import { getSerialService } from './SerialService';

interface UploadEvents {
  statusChange: UploadStatus;
  phaseChange: string; // Tipo da fase atual (poderia ser um union type mais restrito)
  logUpdate: string;
  error: unknown;
}

export class UploadService extends EventEmitter<UploadEvents> {
  private status: UploadStatus = { ...INITIAL_UPLOAD_STATUS };
  private compiler: typeof CompilerService = CompilerService;

  constructor() {
    super();
  }

  /**
   * Retorna o status atual do upload (cópia imutável).
   */
  public getStatus(): UploadStatus {
    return { ...this.status };
  }

  /**
   * Envia um sketch (código C++) para a placa conectada.
   * @param code - Código C++ a ser compilado e gravado na placa.
   */
  public async uploadSketch(code: string): Promise<void> {
    this.updateStatus({
      phase: 'flying',
      isUploading: true,
      showRocket: true,
    });

    try {
      // 1. Compila o código C++ no servidor remoto

      const hexData = await this.compiler.compile(code);

      if (!hexData) {
        throw new Error('Compilação falhou: HEX vazio retornado.');
      }

      // 2. Obtém a porta serial do SerialService
      const serialService = getSerialService();

      // Desconecta o Firmata para liberar o lock da porta
      if (serialService.isConnected()) {
        await serialService.disconnect();
        await new Promise((r) => setTimeout(r, 500)); // Aguarda a liberação da porta pelo SO
      }

      const port = serialService.getPort();
      if (!port) {
        throw new Error('Nenhuma porta serial disponível. Conecte a placa primeiro.');
      }

      // 3. Faz o parse do arquivo HEX em blocos de bytes para gravação

      const firmware = parseHexFile(hexData.hex);

      // 4. Grava o firmware na placa via protocolo STK500
      await uploadFirmware(port, firmware, () => {
        // Log ignorado
      });

      // 5. Marca como sucesso
      this.updateStatus({
        phase: 'success',
        isUploading: false,
      });

      // Esconde o foguete automaticamente após 2 segundos
      setTimeout(() => {
        this.updateStatus({ showRocket: false });
      }, 2000);
    } catch (error: unknown) {
      this.updateStatus({
        phase: 'failure',
        isUploading: false,
      });

      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Restaura o firmware padrão (Firmata) na placa conectada.
   */
  public async restoreBoard(): Promise<void> {
    this.updateStatus({
      phase: 'flying',
      isUploading: true,
      showRocket: true,
    });

    try {
      // 1. Busca o arquivo HEX do Firmata padrão no servidor

      const response = await fetch('/firmata_standard.hex');

      if (!response.ok) {
        throw new Error('Falha ao baixar firmware padrão.');
      }

      const hexData = await response.text();

      // 2. Obtém a porta serial
      const serialService = getSerialService();

      if (serialService.isConnected()) {
        await serialService.disconnect();
        await new Promise((r) => setTimeout(r, 500));
      }

      const port = serialService.getPort();
      if (!port) {
        throw new Error('Nenhuma porta serial disponível.');
      }

      // 3. Faz o parse e grava o firmware na placa

      const firmware = parseHexFile(hexData);

      await uploadFirmware(port, firmware, () => {
        // Log ignorado
      });

      this.updateStatus({
        phase: 'success',
        isUploading: false,
      });

      // Esconde o foguete automaticamente após 2 segundos
      setTimeout(() => {
        this.updateStatus({ showRocket: false });
      }, 2000);
    } catch (error: unknown) {
      this.updateStatus({
        phase: 'failure',
        isUploading: false,
      });

      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Reseta o status do upload para o estado inicial (pronto).
   */
  public reset(): void {
    this.status = { ...INITIAL_UPLOAD_STATUS };
    this.emit('statusChange', this.status);
  }

  /**
   * Atualiza o status do upload e notifica todos os listeners registrados.
   */
  private updateStatus(changes: Partial<UploadStatus>): void {
    const oldPhase = this.status.phase;

    this.status = {
      ...this.status,
      ...changes,
    };

    if (changes.phase && changes.phase !== oldPhase) {
      this.emit('phaseChange', this.status.phase);
    }

    this.emit('statusChange', this.status);
  }

  /**
   * Adiciona texto ao log de upload.
   */
}

// Exporta instância singleton do serviço de upload
let uploadServiceInstance: UploadService | null = null;

export const getUploadService = (): UploadService => {
  if (!uploadServiceInstance) {
    uploadServiceInstance = new UploadService();
  }
  return uploadServiceInstance;
};
