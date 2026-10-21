/// <reference types="w3c-web-serial" />
import { EventEmitter } from 'events';
import { stk } from './stkCommands';

export const serialConnectionStatus = <const>[
  'disconnected',
  'connected', // access granted
  'opened',
  'closing',
  'disconnecting',
];

const DEFAULT_MAXIMUM_CHUNK_LENGTH = 256;

export type SerialConnectionStatus = typeof serialConnectionStatus[number];

export class SerialConnection extends (EventEmitter as any) {
  emit!: (event: string, ...args: any[]) => boolean;
  private port: SerialPort | null;

  private reader: ReadableStreamDefaultReader<Uint8Array> | null;

  private writer?: WritableStreamDefaultWriter<Uint8Array>;

  private status: SerialConnectionStatus;

  constructor() {
    super();

    this.port = null;
    this.reader = null;
    this.status = 'disconnected';
  }

  public async connect(options: SerialOptions, filters?: SerialPortFilter[]) {
    const reused = await this.createOrResetConnection(filters);

    this.reader = await this.getSerialReader(options);
    this.writer = this.port?.writable?.getWriter();

    this.handleSerialReading();

    this.emit('connect', reused);
  }

  public async disconnect() {
    await this.stopWriting();
    await this.stopReading(true);
  }

  public async write(data: Uint8Array) {
    if (!this.writer) return;

    await this.writer.write(data);
  }

  public async writeSTKCommands(...commands: number[]) {
    commands.push(stk.CRC_EOP);

    await this.write(new Uint8Array(commands));
  }

  private resetInternalState() {
    this.port = null;
    this.reader = null;
    this.status = 'disconnected';
  }

  private async stopReading(disconnect?: boolean) {
    if (
      this.status === 'disconnected' ||
      (this.status === 'connected' && !disconnect)
    )
      return;

    if (this.status === 'connected') {
      await this.closeSerialPort();
      return;
    }

    this.status = disconnect ? 'disconnecting' : 'closing';

    await this.reader?.cancel();
  }

  public async stopWriting() {
    this.writer?.releaseLock();
  }

  private async closeSerialPort() {
    if (this.status === 'disconnected' || !this.port) return;

    await this.port?.close();
    this.resetInternalState();
  }

  private async createOrResetConnection(filters?: SerialPortFilter[]) {
    if (this.status === 'opened') {
      await this.stopReading();
      await this.stopWriting();
      await this.port?.close();
      this.status = 'connected';

      return true;
    }

    if (this.port) await this.port.close();

    this.port = await SerialConnection.getSerialPort(filters);
    this.status = 'connected';

    return false;
  }

 // private static async getSerialPort(filters?: SerialPortFilter[]) {
//    if (!navigator.serial) throw new Error('Serial API not supported');

 //   return await navigator.serial.requestPort({ filters });
    //return await navigator.serial.getPorts();
//  }

  private static async getSerialPort(filters?: any) {
    if (!navigator.serial) throw new Error('Serial API not supported');

    return await navigator.serial.requestPort(filters ? { filters } : undefined);
  }

  private async getSerialReader(options: SerialOptions) {
    try {
      if (!this.port) return null;

      await this.port.open(options);

      const reader = this.port.readable?.getReader();

      if (!reader) throw new Error("Device can't be read");

      this.status = 'opened';

      return reader;
    } catch (err) {
      this.resetInternalState();
      throw err;
    }
  }

  private async handleSerialReading() {
    try {
      if (!this.port || !this.reader)
        throw new Error('Unable to read the serial port');

      let str = '';

      while (this.status === 'opened') {
        const { value } = await this.reader.read();

        const data = new TextDecoder().decode(value);

        if (data) this.emit('chunk', data);

        str += data;
        if (!str) continue;

        const messages = str.split('\n');

        if (str.indexOf('\n') >= 0) {
          messages.slice(0, -1).forEach(msg => this.emit('line', msg));

          str = messages.pop() || '';
        } else if (str.length > DEFAULT_MAXIMUM_CHUNK_LENGTH) {
          this.emit('line', str);
          str = '';
        }
      }

      this.reader.releaseLock();
    } catch {
      this.resetInternalState();
    } finally {
      if (this.status === 'closing') this.status = 'connected';
      else if (this.status === 'disconnecting') await this.closeSerialPort();

      this.emit('disconnect', this.status);
    }
  }
}
