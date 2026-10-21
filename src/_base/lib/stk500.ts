/* eslint-disable no-empty */
/**
 * Implementação do protocolo STK500v1 para comunicação estável com bootloaders AVR.
 */

import { STK, uploadConfig } from './serialConfig';
import { EventEmitter } from './EventEmitter';
import { delay } from './byteUtils';

// ==========================================
// 1. Definições de Tipos e Utilitários
// ==========================================

// Eventos suportados pela conexão serial
type SerialEvents = {
  chunk: Uint8Array;
  disconnect: void;
};

interface ISerialPort {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  setSignals(signals: { dataTerminalReady?: boolean; requestToSend?: boolean }): Promise<void>;
}

/**
 * SerialConnection - Wrapper inteligente para Web Serial API
 * Gerencia leitura em background e emissão de eventos.
 */
class SerialConnection extends EventEmitter<SerialEvents> {
  private port: ISerialPort;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private isReading: boolean = false;

  constructor(port: ISerialPort) {
    super();
    this.port = port;
  }

  /**
   * Inicia a conexão e o loop de leitura
   */
  public async open(baudRate: number) {
    if (!this.port) throw new Error('Porta não definida');

    // Se já estiver aberto que não seja readable, tenta abrir
    if (!this.port.readable) {
      await this.port.open({ baudRate });
    }

    // Configura Reader e Writer
    if (this.port.readable && !this.port.readable.locked) {
      this.reader = this.port.readable.getReader();
    }
    if (this.port.writable && !this.port.writable.locked) {
      this.writer = this.port.writable.getWriter();
    }

    this.isReading = true;
    this.readLoop(); // Fire and forget
  }

  /**
   * Loop de leitura contínuo (Background)
   */
  private async readLoop() {
    try {
      while (this.isReading && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.emit('chunk', value);
        }
      }
    } catch (e) {
      console.error('[SerialConnection] Loop de leitura interrompido:', e);
    } finally {
      // Cleanup é feito no disconnect
    }
  }

  /**
   * Envia dados brutos para a porta
   */
  public async write(data: Uint8Array) {
    if (!this.writer) throw new Error('Writer não disponível');
    await this.writer.write(data);
  }

  /**
   * Envia comandos STK e adiciona automaticamente o CRC_EOP (0x20)
   */
  public async writeSTKCommands(...commands: number[]) {
    commands.push(STK.CRC_EOP);
    await this.write(new Uint8Array(commands));
  }

  /**
   * Encerra a conexão e libera os locks
   */
  public async disconnect() {
    this.isReading = false;

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {}
      this.reader.releaseLock();
      this.reader = null;
    }

    if (this.writer) {
      try {
        this.writer.releaseLock();
      } catch {}
      this.writer = null;
    }

    this.emit('disconnect', undefined);
  }
}

// ==========================================
// 2. Funções Auxiliares do Protocolo
// ==========================================

const formatPageAddressToSend = (address: number) => {
  const msb = Math.floor(address / 256);
  const lsb = address % 256;
  return [lsb, msb]; // Little Endian
};

const formatCodeLength = (length: number) => {
  const msb = Math.floor(length / 256);
  const lsb = length % 256;
  return [msb, lsb]; // Big Endian para size? Verificar STK500 spec.
  // STK500 doc: "Be sure to send the length MSB first." -> Sim, Big Endian para Length.
};

/**
 * waitForDeviceSync - O Coração da Otimização
 * Retorna uma Promise que resolve assim que o byte OK (0x10) é recebido.
 */
const waitForDeviceSync = (serial: SerialConnection, timeoutMs = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const handler = (data: Uint8Array) => {
      // Verifica se contém 0x10 (OK)
      if (data.includes(STK.OK)) {
        cleanup();
        resolve();
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout aguardando resposta do dispositivo (${timeoutMs}ms)`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      serial.off('chunk', handler);
    }

    // Escuta o evento
    serial.on('chunk', handler);
  });
};

// ==========================================
// 3. Lógica de Gravação (Páginas)
// ==========================================

const writeCodePage = async (serial: SerialConnection, code: number[], pageAddress: number) => {
  // 1. Carrega o endereço (LOAD ADDRESS)
  await serial.writeSTKCommands(STK.LOAD_ADDRESS, ...formatPageAddressToSend(pageAddress));
  await waitForDeviceSync(serial);

  // 2. Grava a página (PROG_PAGE)
  // Args: bytes_high, bytes_low, memtype('F'), data...
  const [lenHigh, lenLow] = formatCodeLength(code.length);
  await serial.writeSTKCommands(
    STK.PROG_PAGE,
    lenHigh,
    lenLow,
    0x46, // 'F' for Flash
    ...code,
  );
  await waitForDeviceSync(serial);
};

const loopThroughCodePages = async (serial: SerialConnection, firmwareBytes: number[], onLog?: (msg: string) => void) => {
  const pageSize = uploadConfig.PAGE_SIZE;
  const totalPages = Math.ceil(firmwareBytes.length / pageSize);
  let currentPage = 0;

  for (let addr = 0; addr < firmwareBytes.length; addr += pageSize) {
    currentPage++;
    if (currentPage % 5 === 0) onLog?.(`.. Progresso: ${Math.round((currentPage / totalPages) * 100)}%\n`);

    const chunk = firmwareBytes.slice(addr, addr + pageSize);

    // --- OTIMIZAÇÃO: Skip Empty Pages ---
    // Se a página inteira for 0xFF (já apagada), não precisamos gravar.
    // O comando chip erase define toda a flash para 0xFF.
    const isEmpty = chunk.every((byte) => byte === 0xff);
    if (isEmpty) {
      // onLog?.(`.. Skipping page ${currentPage} (Empty)\n`);
      continue;
    }

    // O endereço para LOAD_ADDRESS é em WORDS (16-bit words) para Flash
    // Portanto, dividimos o endereço de bytes por 2.
    const pageAddress = addr / 2;

    await writeCodePage(serial, chunk, pageAddress);
  }
  onLog?.('.. Envio de dados concluído.\n');
};

// ==========================================
// 4. Função Principal (Exportada)
// ==========================================

export async function uploadFirmware(
  port: ISerialPort, // stageContext passa o obj 'port' do Web Serial
  firmwareBytes: number[],
  onLog?: (log: string) => void,
) {
  onLog?.('Iniciando upload otimizado (Event-Driven)...\n');

  const serial = new SerialConnection(port);

  // Configura a conexão
  // O StageContext já abre a porta, mas o SerialConnection precisa pegar os streams.
  // open() aqui vai verificar se já está aberto e só pegar os readers/writers.
  await serial.open(uploadConfig.DEFAULT_BAUD_RATE);

  try {
    // --- 1. Reset da Placa ---
    onLog?.('Resetando placa (DTR)...\n');
    try {
      await port.setSignals({ dataTerminalReady: false });
      await delay(100);
      await port.setSignals({ dataTerminalReady: true }); // DTR High
      await delay(50);
      await port.setSignals({ dataTerminalReady: false }); // DTR Low (Reset Pulse)
    } catch (e) {
      console.warn('Falha no toggle DTR:', e);
    }

    // Aguarda bootloader acordar
    await delay(uploadConfig.BOOTLOADER_START_DELAY);

    // --- 2. Sincronização (Handshake) ---
    onLog?.('Sincronizando...\n');
    let synced = false;

    // Tenta sincronizar até 5 vezes
    for (let i = 0; i < 5; i++) {
      try {
        // Limpa buffer implícito (event listeners novos ignoram passado)
        await serial.writeSTKCommands(STK.GET_SYNC);
        await waitForDeviceSync(serial, 400); // 400ms timeout por tentativa
        synced = true;
        break;
      } catch {
        // Tenta novamente
        // onLog?.(`Tentativa de sync ${i + 1} falhou...\n`);
        await delay(100);
      }
    }

    if (!synced) throw new Error('FALHA DE SINCRONIZAÇÃO: A placa não respondeu.');
    onLog?.('✓ Placa Sincronizada!\n');

    // --- 3. Gravação ---
    // Entra em modo de programação
    await serial.writeSTKCommands(STK.ENTER_PROGMODE);
    await waitForDeviceSync(serial);

    // Grava os blocos
    await loopThroughCodePages(serial, firmwareBytes, onLog);

    // --- 4. Finalização ---
    onLog?.('Finalizando...\n');
    await serial.writeSTKCommands(STK.LEAVE_PROGMODE);
    await waitForDeviceSync(serial);

    onLog?.('✓ Upload Concluído co m Sucesso!\n');
  } catch (error) {
    console.error('Erro no Upload:', error);
    throw error;
  } finally {
    await serial.disconnect();
  }
}
