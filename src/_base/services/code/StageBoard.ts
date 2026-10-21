/**
 * Implementação da placa de hardware para interação em tempo real (Modo Stage).
 * Utiliza o protocolo Firmata para controlar pinos e sensores via adaptador serial.
 */
import { IHardwareBoard } from '../../domain/ports/IHardwareBoard';
import { ISerialPortAdapter } from '../../domain/ports/ISerialPortAdapter';
import { SerialStatus } from '../../domain/entities/ISerial';

export default class StageBoard implements IHardwareBoard {
  private adapter: ISerialPortAdapter | null = null;
  public isConnected: boolean = false;
  private unsubscribeData: (() => void) | null = null;
  private unsubscribeStatus: (() => void) | null = null;

  // Callbacks de eventos de hardware
  callbacksBtn: { [pin: number]: () => void } = {};
  callbacksLuz: { [pin: number]: (value: number) => void } = {};

  // Cache de estados dos pinos digitais e analógicos
  estadosPinos: { [pin: number]: number } = {};
  analogStates: { [pin: number]: number } = {};
  // Cache de distância ultrassônica por pino de eco (em cm)
  ultrasonicStates: { [echoPin: number]: number } = {};

  // Buffer de bytes recebidos da porta serial
  buffer: number[] = [];

  // Cache de pinos já configurados (evita reenvio de comandos de modo)
  configuredPins: Set<number | string> = new Set();

  constructor() {
    // Inicialização dos valores padrão (INPUT sem pullup = LOW)
    for (let i = 0; i < 64; i++) this.estadosPinos[i] = 0;
    for (let i = 0; i < 16; i++) this.analogStates[i] = 0;
  }

  // ===========================================
  // GESTÃO DE CONEXÃO E STREAMS
  // ===========================================

  // Callback para "spy" (Monitor Serial)
  private externalDataListener: ((data: Uint8Array) => void) | null = null;

  public setExternalDataListener(callback: ((data: Uint8Array) => void) | null) {
    this.externalDataListener = callback;
  }

  private currentBaudRate: number = 9600;

  public getBaudRate(): number {
    return this.currentBaudRate;
  }

  /**
   * Estabelece a conexão lógica usando o adapter fornecido.
   * @param {ISerialPortAdapter} adapter - O adaptador que gerencia a porta física.
   * @param {number} baudRate - Taxa de transmissão.
   */
  async connect(adapter: ISerialPortAdapter, baudRate = 9600) {
    this.adapter = adapter;
    this.currentBaudRate = baudRate;

    try {
      // Se o adapter já estiver conectado, apenas nos registramos
      if (adapter.getStatus() === SerialStatus.CONNECTED) {
        // Aguardamos 2 segundos caso a porta tenha acabado de ser aberta
        // O Arduino sofre auto-reset via DTR quando a serial abre e o Bootloader
        // (AVR) demora cerca de 1.5s a 2s. Se enviarmos comandos antes, eles se perdem.
        await new Promise((r) => setTimeout(r, 2000));

        this.setupAdapterListeners();
        this.isConnected = true;
        this.configuredPins.clear();
        this.buffer = [];

        // Envia System Reset (0xFF) para o Firmata começar do zero e sincronizar
        await this.enviarBytes([0xff]);
      } else {
        // Caso contrário, esperamos ele conectar via Use Case
        this.setupAdapterListeners();
        this.isConnected = true;
        this.configuredPins.clear(); // Garante limpeza

        await new Promise((r) => setTimeout(r, 2000));

        // Envia System Reset (0xFF)
        await this.enviarBytes([0xff]);
      }
    } catch (error) {
      console.error('[StageBoard] Erro ao conectar com adapter:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private setupAdapterListeners() {
    this.cleanup();

    if (this.adapter) {
      this.unsubscribeData = this.adapter.onData((data) => {
        if (this.externalDataListener) {
          this.externalDataListener(data);
        }
        this.processarEntrada(data);
      });

      this.unsubscribeStatus = this.adapter.onStatusChange((status) => {
        this.isConnected = status === SerialStatus.CONNECTED;
        if (!this.isConnected) {
          this.cleanup();
        }
      });
    }
  }

  private cleanup() {
    if (this.unsubscribeData) this.unsubscribeData();
    if (this.unsubscribeStatus) this.unsubscribeStatus();
    this.unsubscribeData = null;
    this.unsubscribeStatus = null;
  }

  /**
   * Altera a taxa de transmissão - No modelo Clean, delegamos ao adapter
   */
  async setBaudRate(newRate: number) {
    if (!this.adapter) return;
    this.currentBaudRate = newRate;
    try {
      await this.adapter.setBaudRate(newRate);
    } catch (e) {
      console.error('[StageBoard] Falha ao mudar baud rate no adapter:', e);
    }
  }

  /**
   * Encerra a conexão lógica.
   */
  async disconnect() {
    this.isConnected = false;
    this.cleanup();
  }

  /**
   * Limpa o cache de configuração e reinicia o estado interno do Firmata (Arduino).
   */
  async softReset() {
    if (!this.isConnected) return;
    this.configuredPins.clear();
    await this.enviarBytes([0xff]); // SYSTEM_RESET
  }

  // ===========================================
  // PARSER E TRATAMENTO DE DADOS
  // ===========================================

  processarEntrada(bytes: Uint8Array) {
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }

    if (this.buffer.length > 2048) {
      console.warn('[StageBoard] Buffer Overflow detectado. Realizando flush...');
      this.buffer = [];
      return;
    }

    while (this.buffer.length > 0) {
      const cmd = this.buffer[0];

      if ((cmd & 0xf0) === 0x90) {
        if (this.buffer.length < 3) break;
        const porta = cmd & 0x0f;
        const dados = this.buffer[1] | (this.buffer[2] << 7);
        for (let i = 0; i < 8; i++) {
          const pino = porta * 8 + i;
          if (pino < 2) continue;
          const estado = dados & (1 << i) ? 1 : 0;
          if (this.estadosPinos[pino] !== estado) {
            this.estadosPinos[pino] = estado;
            if (estado === 0 && this.callbacksBtn[pino]) {
              setTimeout(() => this.callbacksBtn[pino](), 0);
            }
          }
        }
        this.buffer.splice(0, 3);
      } else if ((cmd & 0xf0) === 0xe0) {
        if (this.buffer.length < 3) break;
        const pinoA = cmd & 0x0f;
        const valor = this.buffer[1] | (this.buffer[2] << 7);
        if (this.callbacksLuz[pinoA]) this.callbacksLuz[pinoA](valor);
        this.analogStates[pinoA] = valor;
        this.buffer.splice(0, 3);
      } else if (cmd === 0xf0) {
        const fim = this.buffer.indexOf(0xf7);
        if (fim === -1) break;
        // Resposta do ultrassônico: [0xF0, 0x62, echoPin, lsb, msb, 0xF7]
        if (fim >= 4 && this.buffer[1] === 0x62) {
          const echoPin = this.buffer[2];
          const lsb = this.buffer[3] & 0x7f;
          const msb = this.buffer[4] & 0x7f;
          const durationUs = lsb | (msb << 7);
          this.ultrasonicStates[echoPin] = Math.round(durationUs / 58);
        }
        this.buffer.splice(0, fim + 1);
      } else if (cmd === 0xf9) {
        if (this.buffer.length < 3) break;
        this.buffer.splice(0, 3);
      } else {
        this.buffer.shift();
      }
    }
  }

  // ===========================================
  // API PÚBLICA (INTERFACE DE HARDWARE)
  // ===========================================

  getDigital(pin: number | string): boolean {
    const pino = parseInt(pin as string);
    if (!this.configuredPins.has(pino)) {
      // Se estava em outro modo, remove o cache para forçar troca de modo físico
      this.configuredPins.delete(`OUT_${pino}`);
      this.configuredPins.delete(`PWM_${pino}`);
      this.configuredPins.delete(`SERVO_${pino}`);

      this.enviarBytes([0xf4, pino, 0x00]); // Modo INPUT
      const porta = Math.floor(pino / 8);
      this.enviarBytes([0xd0 | porta, 1]); // Habilita Report Digital da Porta
      this.configuredPins.add(pino);
    }
    return this.estadosPinos[pino] === 1;
  }

  setDigital(pin: number | string, val: number | boolean) {
    const pino = parseInt(pin as string);
    const valor = val === true || val === 1 ? 1 : 0;

    // Garante que o pino está em modo OUTPUT
    if (!this.configuredPins.has(`OUT_${pino}`)) {
      this.enviarBytes([0xf4, pino, 0x01]); // PIN_MODE OUTPUT
      this.configuredPins.add(`OUT_${pino}`);
      this.configuredPins.delete(pino); // Remove de INPUT se existir
    }

    // Atualiza o cache local de estado dos pinos para compor a máscara da porta
    this.estadosPinos[pino] = valor;

    const porta = Math.floor(pino / 8);
    let mask = 0;

    // Recupera os estados de todos os pinos da mesma porta (8 bits)
    for (let i = 0; i < 8; i++) {
      const p = porta * 8 + i;
      // ATENÇÃO: Firmata trata digitalWrite HIGH em pinos INPUT como "Ativar Pullup".
      // Para não interfeir nas entradas, SÓ incluímos na máscara os pinos que são saídas (OUT).
      if (this.estadosPinos[p] === 1 && this.configuredPins.has(`OUT_${p}`)) {
        mask |= 1 << i;
      }
    }

    // Envia o DIGITAL_MESSAGE (0x90 | port, LSB, MSB)
    // Este é o comando mais padrão suportado pelo sketch do usuário (digitalWriteCallback)
    this.enviarBytes([0x90 | porta, mask & 0x7f, (mask >> 7) & 0x7f]);
  }

  setPwm(pin: number | string, val: number) {
    const pino = parseInt(pin as string);
    const valor = Math.max(0, Math.min(255, val));
    if (!this.configuredPins.has(`PWM_${pino}`)) {
      this.configuredPins.delete(pino);
      this.configuredPins.delete(`OUT_${pino}`);
      this.configuredPins.delete(`SERVO_${pino}`);

      this.enviarBytes([0xf4, pino, 0x03]); // Modo PWM
      this.configuredPins.add(`PWM_${pino}`);
    }
    this.enviarBytes([0xe0 | pino, valor & 0x7f, (valor >> 7) & 0x7f]);
  }

  setServo(pin: number | string, degree: number) {
    const pino = parseInt(pin as string);
    const angulo = Math.max(0, Math.min(180, degree));
    if (!this.configuredPins.has(`SERVO_${pino}`)) {
      this.configuredPins.delete(pino);
      this.configuredPins.delete(`OUT_${pino}`);
      this.configuredPins.delete(`PWM_${pino}`);

      this.enviarBytes([0xf4, pino, 0x04]); // Modo SERVO
      this.configuredPins.add(`SERVO_${pino}`);
    }
    this.enviarBytes([0xe0 | pino, angulo & 0x7f, (angulo >> 7) & 0x7f]);
  }

  getAnalog(pin: number | string): number {
    let pinoIndex = parseInt(pin as string);
    if (typeof pin === 'string' && pin.startsWith('A')) {
      pinoIndex = parseInt(pin.substring(1));
    }
    const reportKey = 'A' + pinoIndex;
    if (!this.configuredPins.has(reportKey)) {
      this.enviarBytes([0xc0 | pinoIndex, 1]);
      this.configuredPins.add(reportKey);
    }
    return this.analogStates[pinoIndex] || 0;
  }

  setPullup(pin: number | string) {
    const pino = parseInt(pin as string);
    if (!this.configuredPins.has(`PULLUP_${pino}`)) {
      this.configuredPins.delete(`OUT_${pino}`);
      this.configuredPins.delete(`PWM_${pino}`);
      this.configuredPins.delete(`SERVO_${pino}`);

      this.enviarBytes([0xf4, pino, 0x0b]); // Modo INPUT_PULLUP
      const porta = Math.floor(pino / 8);
      this.enviarBytes([0xd0 | porta, 1]); // Habilita Report Digital da Porta
      this.configuredPins.add(`PULLUP_${pino}`);
      this.configuredPins.add(pino);
    }
  }

  async getUltrasonic(trigPin: number | string, echoPin: number | string): Promise<number> {
    const trig = parseInt(trigPin as string);
    const echo = parseInt(echoPin as string);
    // Envia comando Sysex 0x62 (PingFirmata): [0xF0, 0x62, trigPin, echoPin, 0xF7]
    // O firmware responde com [0xF0, 0x62, echoPin, lsb, msb, 0xF7] (duração em µs, 7-bit each)
    await this.enviarBytes([0xf0, 0x62, trig, echo, 0xf7]);
    // Retorna o último valor cacheado (mesmo padrão de getDigital/getAnalog)
    return this.ultrasonicStates[echo] ?? 0;
  }

  registerButton(pin: number | string, callback: () => void) {
    const pino = parseInt(pin as string);
    this.callbacksBtn[pino] = callback;

    if (!this.configuredPins.has(`BUTTON_${pino}`)) {
      this.configuredPins.delete(`OUT_${pino}`);
      this.configuredPins.delete(`PWM_${pino}`);

      this.enviarBytes([0xf4, pino, 0x0b]); // INPUT_PULLUP
      const porta = Math.floor(pino / 8);
      this.enviarBytes([0xd0 | porta, 1]); // Habilita Report Digital da Porta
      this.configuredPins.add(`BUTTON_${pino}`);
      this.configuredPins.add(pino);
    }
  }

  registerSensor(pin: number | string, callback: (val: number) => void) {
    let pinoIndex = parseInt(pin as string);
    if (typeof pin === 'string' && pin.startsWith('A')) {
      pinoIndex = parseInt(pin.substring(1));
    }
    this.callbacksLuz[pinoIndex] = callback;
    this.enviarBytes([0xc0 | pinoIndex, 1]);
    this.configuredPins.add('A' + pinoIndex);
  }

  /**
   * Método interno para escrita no stream de saída via adapter.
   */
  async enviarBytes(array: number[]) {
    console.log(`[StageBoard] >> Enviando:`, array.map((b) => b.toString(16).padStart(2, '0')).join(' '));
    if (!this.adapter) {
      console.warn(`[StageBoard] Tentativa de envio sem adapter configurado!`);
      return;
    }
    try {
      await this.adapter.write(new Uint8Array(array));
    } catch (e: unknown) {
      console.warn(`[StageBoard] Falha no envio dos bytes:`, e);
    }
  }

  /**
   * Helper para enviar strings cruas pela Serial via adapter.
   */
  async writeString(data: string) {
    if (!this.adapter) {
      console.warn(`[StageBoard] Tentativa de escrever string sem adapter configurado!`);
      return;
    }
    try {
      await this.adapter.writeString(data);
    } catch (e: unknown) {
      console.warn(`[StageBoard] Falha na escrita da string:`, e);
    }
  }
}
