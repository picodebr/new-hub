/**
 * ISerialPortAdapter - Contrato para comunicação serial de baixo nível.
 * 
 * Responsabilidade: Isolar a complexidade da Web Serial API ou drivers nativos, 
 * fornecendo uma interface unificada para leitura/escrita de buffers e gestão de 
 * sinais (DTR/RTS) necessários para reset de hardware.
 */
import { SerialStatus, SerialConfig } from "../entities/ISerial";

export interface ISerialPortAdapter {
    getStatus(): SerialStatus;
    connect(config: SerialConfig, explicitPort?: import("../entities/ISerial").ISerialPort): Promise<void>;
    disconnect(): Promise<void>;
    write(data: Uint8Array): Promise<void>;
    writeString(data: string): Promise<void>;
    onData(callback: (data: Uint8Array) => void): () => void;
    onError(callback: (error: Error) => void): () => void;
    onStatusChange(callback: (status: SerialStatus) => void): () => void;
    setBaudRate(baudRate: number): Promise<void>;
    readonly port: import("../entities/ISerial").ISerialPort | null;
}
