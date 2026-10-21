/**
 * WebSerialAdapter - Implementação concreta da comunicação Serial via Web API.
 *
 * Responsabilidade: Lidar com a abertura de portas, configuração de baudrate
 * e o fluxo de leitura/escrita de streams de dados. Converte os comandos de
 * alto nível da aplicação em pacotes de bytes trafegados via USB/Serial para
 * a placa controladora.
 *
 * Suporta dois ambientes:
 * 1. Web: Usa a Web Serial API nativa (navigator.serial)
 * 2. React Native Webview: Usa postMessage para comunicar com o lado nativo
 *
 * Operações Principais:
 * - requestPort: Interação com o navegador para seleção de hardware pelo usuário.
 * - getReader/getWriter: Gestão de fluxos assíncronos para comunicação não-bloqueante.
 * - setBaudRate: Reconfiguração dinâmica da velocidade de transmissão.
 *
 * Interações: Implementa a interface `ISerialPortAdapter`, isolando o domínio
 * das APIs específicas do navegador.
 */
import { ISerialPortAdapter } from '../domain/ports/ISerialPortAdapter';
import { SerialStatus, SerialConfig, ISerialPort, SerialOptions, NavigatorWithSerial, SerialConnectionEvent } from '../domain/entities/ISerial';

export class WebSerialAdapter implements ISerialPortAdapter {
  private _port: ISerialPort | null = null;
  public get port(): ISerialPort | null {
    return this._port;
  }
  private status: SerialStatus = SerialStatus.DISCONNECTED;
  private dataCallbacks: ((data: Uint8Array) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];
  private statusCallbacks: ((status: SerialStatus) => void)[] = [];
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private isReactNative: boolean = false;
  private postMessage: ((data: string) => void) | null = null;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor() {
    this.detectEnvironment();
    this.setupGlobalListeners();
  }

  /**
   * Detecta se está em React Native Webview
   */
  private detectEnvironment() {
    if (typeof window !== 'undefined') {
      const webview = (window as any).ReactNativeWebView;
      if (webview && webview.postMessage) {
        this.isReactNative = true;
        this.postMessage = webview.postMessage.bind(webview);
      }
    }
  }

  private setupGlobalListeners() {
    // Setup padrão para Web Serial API (funciona em web e React Native se app injetou)
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      const nav = navigator as unknown as NavigatorWithSerial;
      nav.serial.addEventListener('disconnect', (e: Event) => {
        const serialEvent = e as SerialConnectionEvent;
        if (serialEvent.port === this._port) {
          this.handleDisconnect();
        }
      });
    }

    // Se não há navigator.serial, configurar listener para mensagens do lado nativo (fallback)
    if (typeof navigator !== 'undefined' && !('serial' in (navigator as any)) && this.isReactNative && this.postMessage) {
      this.messageHandler = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

          if (data.type === 'SERIAL_PORT_SELECTED') {
            // Resposta do React Native: porta serial foi selecionada
            if (data.port) {
              this._port = data.port;
            }
          } else if (data.type === 'SERIAL_DATA') {
            // Dados recebidos da porta serial
            if (data.data) {
              const bytes = new Uint8Array(data.data);
              this.dataCallbacks.forEach((cb) => cb(bytes));
            }
          } else if (data.type === 'SERIAL_DISCONNECTED') {
            // Porta foi desconectada pelo lado nativo
            this.handleDisconnect();
          } else if (data.type === 'SERIAL_ERROR') {
            // Erro na porta serial
            const error = new Error(data.message || 'Erro serial do React Native');
            this.errorCallbacks.forEach((cb) => cb(error));
          }
        } catch (e) {
          console.error('[WebSerialAdapter] Erro processando mensagem:', e);
        }
      };
      window.addEventListener('message', this.messageHandler);
    }
  }

  private handleDisconnect() {
    if (this.status === SerialStatus.DISCONNECTED) return;
    this.status = SerialStatus.DISCONNECTED;
    this.notifyStatusChange();
    this.cleanup();
  }

  private notifyStatusChange() {
    this.statusCallbacks.forEach((cb) => cb(this.status));
  }

  public getStatus(): SerialStatus {
    return this.status;
  }

  public async connect(config: SerialConfig, explicitPort?: ISerialPort): Promise<void> {
    // PRIORIDADE 1: Tentar Web Serial API (funciona em web e React Native com navigator.serial injetado)
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      return this.connectViaWebSerial(config, explicitPort);
    }

    // PRIORIDADE 2: Se não há Web Serial API, tentar postMessage (fallback para React Native novo)
    if (this.isReactNative && this.postMessage) {
      return this.connectViaPostMessage(config);
    }

    // PRIORIDADE 3: Se nada funciona, erro
    throw new Error(
      'Nenhum método de conexão serial disponível. ' + 'Verifique se está em um navegador moderno ou em React Native com suporte serial.',
    );
  }

  /**
   * Conexão via Web Serial API (padrão em web e React Native antigo)
   */
  private async connectViaWebSerial(config: SerialConfig, explicitPort?: ISerialPort): Promise<void> {
    // Se já estiver conectado à mesma porta, não faz nada
    if (this.status === SerialStatus.CONNECTED && this._port) {
      if (!explicitPort || explicitPort === this._port) {
        console.log('[WebSerialAdapter] Porta já conectada. Ignorando.');
        return;
      }
    }

    // Verificação de segurança para SSR/build
    if (typeof navigator === 'undefined' || !('serial' in navigator)) {
      throw new Error('Web Serial API não disponível neste ambiente.');
    }

    try {
      this.status = SerialStatus.CONNECTING;
      this.notifyStatusChange();

      const nav = navigator as unknown as NavigatorWithSerial;

      // Se recebemos uma porta explícita (ex: reconexão pós-upload), usamos ela.
      // Caso contrário, solicitamos ao usuário.
      this._port = explicitPort || (await nav.serial.requestPort());

      const options: SerialOptions = {
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity,
        flowControl: config.flowControl,
      };

      // Para evitar erros de "Port already open" durante reconexões rápidas,
      // verificamos se os streams (readable/writable) já estão vivos.
      try {
        if (this._port?.readable || this._port?.writable) {
          console.log('[WebSerialAdapter] Porta detectada como já aberta.');
        } else {
          await this._port!.open(options);
        }
      } catch (openErr: unknown) {
        const msg = (openErr as Error).message || '';
        if (msg.includes('already open')) {
          console.warn('[WebSerialAdapter] Porta já estava aberta (capturado no catch).');
        } else {
          throw openErr;
        }
      }

      this.status = SerialStatus.CONNECTED;

      // Só pedimos o writer se ele não existir e a porta permitir
      if (!this.writer && this._port.writable) {
        this.writer = this._port.writable.getWriter();
      }

      this.notifyStatusChange();

      this.startReading();
    } catch (err) {
      this.status = SerialStatus.ERROR;
      this.notifyStatusChange();
      this.errorCallbacks.forEach((cb) => cb(err as Error));
      throw err;
    }
  }

  /**
   * Conexão via postMessage (fallback para React Native novo sem navigator.serial)
   */
  private async connectViaPostMessage(config: SerialConfig): Promise<void> {
    try {
      this.status = SerialStatus.CONNECTING;
      this.notifyStatusChange();

      // Envia mensagem para React Native solicitar seleção de porta
      this.postMessage!(
        JSON.stringify({
          type: 'REQUEST_SERIAL_PORT',
          config: {
            baudRate: config.baudRate,
            dataBits: config.dataBits,
            stopBits: config.stopBits,
            parity: config.parity,
            flowControl: config.flowControl,
          },
        }),
      );

      // Aguarda resposta do React Native (máximo 30 segundos)
      const portSelected = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 30000);

        const checkPort = () => {
          if (this._port) {
            clearTimeout(timeout);
            resolve(true);
          } else {
            setTimeout(checkPort, 100);
          }
        };
        checkPort();
      });

      if (!portSelected) {
        throw new Error('Timeout ao aguardar seleção de porta no React Native');
      }

      this.status = SerialStatus.CONNECTED;
      this.notifyStatusChange();
    } catch (err) {
      this.status = SerialStatus.ERROR;
      this.notifyStatusChange();
      this.errorCallbacks.forEach((cb) => cb(err as Error));
      throw err;
    }
  }

  private async startReading() {
    if (!this._port || !this._port.readable) return;

    // Adquire o bloqueio (lock) do stream para leitura.
    // No Web Serial, apenas um leitor pode estar ativo por vez.
    this.reader = this._port.readable.getReader();
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break; // Porta fechada externamente ou cancelada
        if (value) {
          // Notifica todos os listeners registrados (ex: SerialMonitor, context)
          this.dataCallbacks.forEach((cb) => cb(value));
        }
      }
    } catch (err) {
      console.error('[WebSerialAdapter] Erro na leitura do stream:', err);

      // Propaga o erro para os callbacks (necessário para disparar o modal de aviso)
      this.errorCallbacks.forEach((cb) => cb(err as Error));

      const error = err as any;
      const msg = error.message || '';
      const name = error.name || '';

      if (msg.includes('The device has been lost') || msg.includes('dispositivo foi perdido') || name === 'NetworkError') {
        console.warn('[WebSerialAdapter] Conexão perdida detectada pelo stream. Forçando desconexão.');
        this.handleDisconnect();
      }
    } finally {
      // Importante liberar o lock para que outros leitores (ou o próximo ciclo)
      // possam usar o stream readable da porta.
      if (this.reader) {
        this.reader.releaseLock();
        this.reader = null;
      }
    }
  }

  public async disconnect(): Promise<void> {
    // PRIORIDADE 1: Limpar Web Serial API (se estiver sendo usada)
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (err) {
        console.warn('[WebSerialAdapter] Erro ao cancelar reader:', err);
      }
      this.reader = null;
    }

    if (this.writer) {
      try {
        this.writer.releaseLock();
      } catch (err) {
        console.warn('[WebSerialAdapter] Erro ao liberar writer:', err);
      }
      this.writer = null;
    }

    if (this._port) {
      try {
        await this._port.close();
      } catch (err) {
        console.warn('[WebSerialAdapter] Erro ao fechar porta:', err);
      }
      this._port = null;
    }

    // PRIORIDADE 2: Se Web Serial não foi usada, enviar mensagem via postMessage (fallback)
    if (!this.reader && !this.writer && this.isReactNative && this.postMessage) {
      try {
        this.postMessage(
          JSON.stringify({
            type: 'SERIAL_DISCONNECT',
          }),
        );
      } catch (err) {
        console.error('[WebSerialAdapter] Erro ao enviar desconexão via postMessage:', err);
      }

      // Remover listener de mensagens
      if (this.messageHandler) {
        window.removeEventListener('message', this.messageHandler);
        this.messageHandler = null;
      }
    }

    this.handleDisconnect();
  }

  public async write(data: Uint8Array): Promise<void> {
    // PRIORIDADE 1: Usar writer da Web Serial API (se disponível)
    if (this.writer) {
      await this.writer.write(data);
      return;
    }

    // PRIORIDADE 2: Fallback para postMessage (React Native novo)
    if (this.isReactNative && this.postMessage) {
      try {
        this.postMessage(
          JSON.stringify({
            type: 'SERIAL_WRITE',
            data: Array.from(data),
          }),
        );
        return;
      } catch (err) {
        const error = new Error('Erro ao escrever na porta serial via React Native');
        this.errorCallbacks.forEach((cb) => cb(error));
        throw error;
      }
    }

    throw new Error('Porta não disponível para escrita.');
  }

  public async writeString(data: string): Promise<void> {
    const encoder = new TextEncoder();
    await this.write(encoder.encode(data));
  }

  public onData(callback: (data: Uint8Array) => void): () => void {
    this.dataCallbacks.push(callback);
    return () => {
      this.dataCallbacks = this.dataCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onStatusChange(callback: (status: SerialStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter((cb) => cb !== callback);
    };
  }

  public async setBaudRate(baudRate: number): Promise<void> {
    if (!this._port) return;

    console.log(`[WebSerialAdapter] Alterando baud rate para ${baudRate}...`);

    // 1. Para leitura
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }

    // Libera writer antes de fechar a porta
    if (this.writer) {
      this.writer.releaseLock();
      this.writer = null;
    }

    // 2. Fecha porta
    try {
      await this._port.close();
    } catch (e) {
      console.warn('[WebSerialAdapter] Erro ao fechar porta para mudar baud rate:', e);
    }

    // 3. Reabre com novo baud
    const options: SerialOptions = {
      baudRate: baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: 'none',
    };

    await this._port.open(options);

    if (this._port.writable) {
      this.writer = this._port.writable.getWriter();
    }

    // 4. Reinicia leitura
    this.startReading();
  }

  private cleanup() {
    this.reader = null;
  }
}
