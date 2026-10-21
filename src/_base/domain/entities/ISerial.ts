/**
 * ISerial - Definições de Tipos para Comunicação Serial.
 * 
 * Este arquivo contém as interfaces e enums que padronizam a interação com a 
 * Web Serial API. Ele define o estado da conexão, configurações de baud rate 
 * e as interfaces de "shim" para os objetos nativos do navegador.
 */

export enum SerialStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
}

export interface SerialEvents {
    statusChange: SerialStatus;
    error: unknown;
    disconnect: void;
}

export interface SerialConfig {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    flowControl?: 'none' | 'hardware';
}

export const DEFAULT_SERIAL_CONFIG: SerialConfig = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none'
};

// Web Serial API Interfaces
export interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
}

export interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
}

export interface SerialOutputSignals {
    dataTerminalReady?: boolean;
    requestToSend?: boolean;
    break?: boolean;
}

export interface SerialInputSignals {
    dataCarrierDetect: boolean;
    clearToSend: boolean;
    ringIndicator: boolean;
    dataSetReady: boolean;
}

export interface SerialConnectionEvent extends Event {
    readonly port: ISerialPort;
}

export interface ISerialPort extends EventTarget {
    onconnect: ((this: ISerialPort, ev: Event) => void) | null;
    ondisconnect: ((this: ISerialPort, ev: Event) => void) | null;
    readonly connected: boolean;
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    getInfo(): SerialPortInfo;
    open(options: SerialOptions): Promise<void>;
    setSignals(signals?: SerialOutputSignals): Promise<void>;
    getSignals(): Promise<SerialInputSignals>;
    close(): Promise<void>;
    forget(): Promise<void>;
}

export interface Serial extends EventTarget {
    onconnect: ((this: Serial, ev: Event) => void) | null;
    ondisconnect: ((this: Serial, ev: Event) => void) | null;
    getPorts(): Promise<ISerialPort[]>;
    requestPort(options?: SerialPortRequestOptions): Promise<ISerialPort>;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
}

export interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
}

export interface NavigatorWithSerial extends Navigator {
    serial: Serial;
}
