import { EventEmitter } from 'events';
import { deepCopy } from './deepCopy';

type DataCallback<T> = (value: Readonly<T>) => void;

type MixedListenerArgs<T, K extends keyof T> = [DataCallback<T>] | [K, DataCallback<T>];

const ALL_KEYS_SYMBOL = '__KEY_VALUE_MANAGER_ALL_KEYS_SYMBOL';

class _KeyValueManager<T> extends (EventEmitter as any) {
  emit!: (event: string | symbol, ...args: any[]) => boolean;
  addListener!: (event: string | symbol, listener: (...args: any[]) => void) => this;
  removeListener!: (event: string | symbol, listener: (...args: any[]) => void) => this;
  private data: T;

  constructor(data: T) {
    super();

    if (typeof data !== 'object') throw new Error('Data must be an object.');

    this.data = deepCopy(data);

    Object.keys(this.data as object).forEach((k) => {
      const key = k as keyof T;

      if (k === ALL_KEYS_SYMBOL) throw new Error(`${ALL_KEYS_SYMBOL} is an exclusive object key.`);

      Object.defineProperty(this, k, {
        get: () => {
          return this.data[key];
        },

        set: (value: T[keyof T]) => {
          this.data[key] = value;
          this.emit(k.toString(), this.data);
          return this.data[key];
        },
      });
    });
  }

  public addChangeListener(callback: DataCallback<T>): this;

  public addChangeListener<K extends keyof T>(key: K, callback: DataCallback<T>): this;

  public addChangeListener<K extends keyof T>(...args: MixedListenerArgs<T, K>) {
    if (args.length === 1) this.addListener(ALL_KEYS_SYMBOL, args[0]);
    else this.addListener(args[0].toString(), args[1]);

    return this;
  }

  public removeChangeListener(callback: DataCallback<T>): this;

  public removeChangeListener<K extends keyof T>(key: K, callback: DataCallback<T>): this;

  public removeChangeListener<K extends keyof T>(...args: MixedListenerArgs<T, K>) {
    if (args.length === 1) this.removeListener(ALL_KEYS_SYMBOL, args[0]);
    else this.removeListener(args[0].toString(), args[1]);

    return this;
  }
}

type KeyValueManager<T> = _KeyValueManager<T> & T;

export const KeyValueManager: new <T>(data: T) => KeyValueManager<T> = _KeyValueManager as any;
