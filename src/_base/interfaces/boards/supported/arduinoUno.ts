import { IBoard } from '../IBoard';

export const arduinoUnoBoard: IBoard = {
  name: 'Arduino Uno',
  fqbn: 'arduino:avr:uno',
  pins: [
    { value: '0' },
    { value: '1' },
    { value: '2' },
    { value: '3', isPWM: true },
    { value: '4' },
    { value: '5', isPWM: true },
    { value: '6', isPWM: true },
    { value: '7' },
    { value: '8' },
    { value: '9', isPWM: true },
    { value: '10', isPWM: true },
    { value: '11', isPWM: true },
    { value: '12' },
    { value: '13' },
    { value: 'A0', isAnalog: true },
    { value: 'A1', isAnalog: true },
    { value: 'A2', isAnalog: true },
    { value: 'A3', isAnalog: true },
    { value: 'A4', isAnalog: true },
    { value: 'A5', isAnalog: true },
  ],
};
