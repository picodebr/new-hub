/**
 * Interface para abstração de uma placa de hardware.
 * Define operações de I/O (Digital, Analógico, PWM, Servo) e conexão.
 */
import { ISerialPortAdapter } from "./ISerialPortAdapter";

export interface IHardwareBoard {
    connect(adapter: ISerialPortAdapter, baudRate?: number): Promise<void>;
    setBaudRate(newRate: number): void;
    getBaudRate(): number;
    disconnect(): Promise<void>;
    softReset?(): Promise<void>;

    getDigital(pin: number | string): boolean;
    setDigital(pin: number | string, val: number | boolean): void;

    setPwm(pin: number | string, val: number): void;
    setServo(pin: number | string, degree: number): void;

    getAnalog(pin: number | string): number;

    registerButton(pin: number | string, callback: () => void): void;
    registerSensor(pin: number | string, callback: (val: number) => void): void;

    setExternalDataListener(callback: ((data: Uint8Array) => void) | null): void;

    writeString(data: string): Promise<void>;
}
