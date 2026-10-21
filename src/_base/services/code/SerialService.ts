/* eslint-disable no-console */
/**
 * Gerencia a conexão física com a placa via Web Serial API.
 * Controla o estado da porta serial e provê acesso às funções de hardware em tempo real.
 */

import { SerialStatus, DEFAULT_SERIAL_CONFIG, ISerialPort, SerialEvents } from '@/_base/domain/entities';
import { EventEmitter } from '../../lib/EventEmitter';
import StageBoard from './StageBoard';
import { IHardwareBoard } from '../../domain/ports/IHardwareBoard';
import { ISerialPortAdapter } from '../../domain/ports/ISerialPortAdapter';
import { WebSerialAdapter } from '../../adapters/WebSerialAdapter';
import { ConnectSerialUseCase } from '../../use-cases/ConnectSerialUseCase';

export class SerialService extends EventEmitter<SerialEvents> {
  private static instance: SerialService | null = null;
  private status: SerialStatus = SerialStatus.DISCONNECTED;
  private board: IHardwareBoard;
  private adapter: ISerialPortAdapter;
  private connectUseCase: ConnectSerialUseCase;

  private constructor() {
    super();
    this.board = new StageBoard();
    this.adapter = new WebSerialAdapter();
    this.connectUseCase = new ConnectSerialUseCase(this.adapter);
    this.initializeEventListeners();
  }

  public static getInstance(): SerialService {
    if (!SerialService.instance) {
      SerialService.instance = new SerialService();
    }
    return SerialService.instance;
  }

  private initializeEventListeners(): void {
    this.adapter.onStatusChange((status) => {
      if (this.status === status) return;
      this.status = status;
      this.emit('statusChange', this.status);
      if (status === SerialStatus.DISCONNECTED) {
        this.emit('disconnect', undefined);
      }
    });

    this.adapter.onError((err) => {
      this.emit('error', err);
    });
  }

  public async connect(explicitPort?: ISerialPort): Promise<void> {
    try {
      // No modelo Clean, o adapter cuida da seleção da porta se necessário.
      // O Use Case ConnectSerialUseCase gerencia a conexão do adapter.
      await this.connectUseCase.execute(DEFAULT_SERIAL_CONFIG, explicitPort);

      // Após conectar o adapter, conectamos o StageBoard (Firmata)
      await this.board.connect(this.adapter);
    } catch (e: unknown) {
      console.error('[SerialService] Erro ao conectar:', e);
      throw e;
    }
  }

  /**
   * Desconecta da porta serial e do StageBoard.
   */
  public async disconnect(): Promise<void> {
    try {
      await this.board.disconnect();
      await this.adapter.disconnect();
    } catch (e) {
      console.error('[SerialService] Erro ao desconectar:', e);
      this.status = SerialStatus.DISCONNECTED;
      this.emit('statusChange', this.status);
    }
  }

  /**
   * Retorna a porta serial atualmente conectada (ou null se desconectado).
   */
  public getPort(): ISerialPort | null {
    return this.adapter.port;
  }

  /**
   * Retorna a instância do StageBoard (placa de hardware virtual).
   */
  public getBoard(): IHardwareBoard {
    return this.board;
  }

  /**
   * Verifica se o serviço está atualmente conectado a uma porta serial.
   */
  public isConnected(): boolean {
    return this.status === SerialStatus.CONNECTED;
  }

  /**
   * Retorna o status atual da conexão serial.
   */
  public getStatus(): SerialStatus {
    return this.status;
  }

  /**
   * Reseta a instância singleton (utilizado para testes).
   */
  public static resetInstance(): void {
    SerialService.instance = null;
  }
}

// Exporta getter da instância singleton do SerialService
export const getSerialService = () => SerialService.getInstance();
