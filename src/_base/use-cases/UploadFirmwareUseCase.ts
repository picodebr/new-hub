/**
 * UploadFirmwareUseCase - Caso de uso para gravação de código no microcontrolador.
 *
 * Responsabilidade: Transformar o código visual em binários funcionais e gerenciar
 * o protocolo de upload (STK500). Lida com o ciclo completo: compilação,
 * reset de hardware, flash e reconexão automática.
 *
 * Operações Principais:
 * - Handshake e sincronização com o bootloader AVR.
 * - Transmissão de blocos de memória com tolerância a falhas.
 * - Tradução de erros técnicos em mensagens compreensíveis para o usuário.
 */
import { parseHexFile } from '../lib/byteUtils';
import { uploadFirmware } from '../lib/stk500';
import { ISerialPort, NavigatorWithSerial } from '../domain/entities';
import { CompilerService } from '../services/code/CompilerService';
import { restoreCode } from '../services/code';

export interface UploadProgressCallbacks {
  onPhaseChange: (phase: 'ready' | 'compiling' | 'flying' | 'success' | 'failure' | '') => void;
  onError: (errorMessage: string) => void;
  onTimeout?: () => void;
}

export interface UploadHardwareDependencies {
  isSerialConnected: boolean;
  currentPort: ISerialPort | null;
  disconnectSerial: () => Promise<void>;
  connectSerial: (explicitPort?: ISerialPort) => Promise<void>;
}

export class UploadFirmwareUseCase {
  public static async execute(code: string, hardware: UploadHardwareDependencies, callbacks: UploadProgressCallbacks): Promise<void> {
    // 0. Verificação rigorosa da porta serial
    const nav = navigator as unknown as NavigatorWithSerial;
    if (!nav.serial) {
      callbacks.onError('Web Serial API não suportada neste navegador.');
      callbacks.onPhaseChange('failure');
      return;
    }

    const ports = await nav.serial.getPorts();

    // Travas de segurança: garante que a placa está conectada antes de prosseguir
    if (!hardware.isSerialConnected) {
      callbacks.onError("A placa não está conectada. Clique no botão 'Conectar' na barra superior.");
      callbacks.onPhaseChange('failure');
      return;
    }

    if (ports.length === 0) {
      callbacks.onError('Nenhuma porta serial autorizada encontrada. Reconecte o USB.');
      callbacks.onPhaseChange('failure');
      return;
    }

    if (!code) {
      callbacks.onError('Código vazio!');
      callbacks.onPhaseChange('failure');
      return;
    }

    let portToReconnect: ISerialPort | null = null;
    let isHardwareError = false;

    callbacks.onPhaseChange('ready');

    try {
      // ETAPA 1: COMPILAÇÃO — envia o código C++ para o servidor de compilação
      callbacks.onPhaseChange('compiling');
      const result = await CompilerService.compile(code);

      // ETAPA 2: PREPARAÇÃO DO FIRMWARE — converte o HEX retornado em blocos de bytes
      callbacks.onPhaseChange('flying');
      let firmData;
      try {
        firmData = parseHexFile(result.hex);
      } catch (err) {
        callbacks.onError('Falha ao organizar o código binário (Hex parse error).');
        throw err;
      }

      // STEP 3: DESCONEXÃO USB (Obrigatório para o Upload)
      // No Chrome/WebSerial, não podemos abrir a mesma porta física com dois baud rates
      // simultâneos na mesma sessão sem liberar o lock. Como a conexão de monitoramento
      // (Firmata) usa 9600bps e o upload (AVR/STK500) usa 115200bps, precisamos
      // "soltar" a porta completamente no SO antes de reiniciá-la no modo de gravação.
      if (hardware.isSerialConnected) {
        portToReconnect = hardware.currentPort;
        try {
          await hardware.disconnectSerial();
        } catch {
          console.warn('[Upload] Aviso de desconexão parcial');
        }

        // Pausa de 100ms: Margem de segurança para o sistema operacional
        // fechar o file descriptor antes da próxima tentativa de abertura.
        await new Promise((r) => setTimeout(r, 100));
      }

      // ETAPA 4: UPLOAD — abre a porta a 115200bps e grava o firmware via STK500
      const availablePorts = await nav.serial.getPorts();
      if (availablePorts.length === 0) throw new Error('Porta não encontrada. Reconecte a placa e tente novamente.');

      const targetPort = portToReconnect || availablePorts[0];

      // Verificação robusta: tenta fechar a porta antes de reabri-la a 115200bps para upload
      try {
        // Tenta fechar preventivamente, caso esteja aberta em outro modo
        await targetPort.close();
      } catch {
        // Ignora se já estava fechada ou se falhar ao fechar (ex: não estava aberta)
      }

      await targetPort.open({ baudRate: 115200 });
      await uploadFirmware(targetPort, firmData);
      await targetPort.close();

      callbacks.onPhaseChange('success');
    } catch (e: unknown) {
      console.error(e);
      callbacks.onPhaseChange('failure');

      let msg = e instanceof Error ? e.message : String(e);

      // Tradução de erros técnicos para mensagens amigáveis ao usuário
      // TRADUÇÃO TÉCNICA DE ERROS:
      // A API de Web Serial do Chrome retorna mensagens genéricas do sistema.
      // Aqui, mapeamos essas mensagens para algo que faça sentido ao usuário
      // leigo (ex: cabo solto ou porta ocupada por outro app).
      if (msg.includes('device was disconnected') || msg.includes('NetworkError')) {
        msg = 'Cabo USB desconectado ou Placa Perdida!';
        isHardwareError = true;
      } else if (msg.includes('Access denied') || msg.includes('is already open')) {
        msg = 'Acesso à porta negado. Tente fechar outros programas (Arduino IDE, etc).';
        isHardwareError = true;
      } else if (msg.includes('Port not found') || msg.includes('no port')) {
        msg = 'Placa não encontrada. Reconecte o USB.';
        isHardwareError = true;
      } else if (msg.includes("Failed to execute 'open'")) {
        msg = 'Erro ao abrir a porta USB. Tente novamente.';
        isHardwareError = true;
      } else if (msg.includes('An unknown system error has occurred')) {
        msg = 'Erro de sistema desconhecido. Por favor, desconecte e reconecte o cabo USB da placa.';
        isHardwareError = true;
      }

      if (msg.includes('Timeout')) {
        if (callbacks.onTimeout) callbacks.onTimeout();
      }

      // Detecção robusta de erro: se o erro ocorreu após a compilação, a porta provavelmente foi perdida/bloqueada
      callbacks.onError(msg);

      // Determina se precisamos forçar o "esquecimento" da porta para reconexão
      if (isHardwareError) {
        try {
          await hardware.disconnectSerial();
        } catch (e) {
          console.warn('[Upload] Falha ao desconectar serial após erro:', e);
        }
        portToReconnect = null;
      }

      try {
        const nav = navigator as unknown as NavigatorWithSerial;
        const p = await nav.serial.getPorts();
        if (p[0]?.readable) await p[0].close();
      } catch (e) {
        console.error('Erro ao fechar a porta:', e);
      }
    } finally {
      // ETAPA 5: RECONEXÃO AUTOMÁTICA — reconecta à placa após o upload
      if (portToReconnect) {
        console.log('[Upload] Tentando reconectar automaticamente à porta...', portToReconnect);
        try {
          await new Promise((r) => setTimeout(r, 500));
          await hardware.connectSerial(portToReconnect);
        } catch (recErr) {
          console.warn('[Upload] Falha na reconexão automática pós-upload:', recErr);
        }
      }
    }
  }

  public static async restore(hardware: UploadHardwareDependencies, callbacks: UploadProgressCallbacks): Promise<void> {
    // 0. Verificação rigorosa da porta — garante que existe uma porta autorizada
    if (!hardware.currentPort && !hardware.isSerialConnected) {
      const nav = navigator as unknown as NavigatorWithSerial;
      const ports = await nav.serial.getPorts();
      if (ports.length === 0) {
        callbacks.onError('Por favor, conecte a placa primeiro (Botão USB na Navbar).');
        callbacks.onPhaseChange('failure');
        return;
      }
    }

    callbacks.onPhaseChange('flying');

    // 1. Reset/Desconexão da conexão atual para liberar a porta
    const preservedPort = hardware.currentPort;

    if (hardware.isSerialConnected) {
      await hardware.disconnectSerial();
      await new Promise((r) => setTimeout(r, 500));
    }

    try {
      const response = await restoreCode();

      if (!response.ok) throw new Error('Erro ao baixar firmware.');
      const data = await response.data;
      if (!data || !data.hex) throw new Error(data.logs || 'Erro ao baixar arquivo do firmware da placa.');

      // 3. Parse do HEX e gravação na placa via STK500
      const firmData = parseHexFile(data.hex);

      let targetPort = hardware.currentPort as ISerialPort | null;
      const nav = navigator as unknown as NavigatorWithSerial;

      if (!targetPort) {
        const ports = await nav.serial.getPorts();
        if (ports.length > 0) targetPort = ports[0] as ISerialPort;
        else throw new Error('Porta não encontrada. Reconecte o USB.');
      }

      await targetPort.open({ baudRate: 115200 });
      await uploadFirmware(targetPort, firmData);
      await targetPort.close();

      callbacks.onPhaseChange('success');

      // 4. Reconexão automática após restauração do firmware
      await new Promise((r) => setTimeout(r, 1000));

      if (targetPort) {
        await hardware.connectSerial(targetPort);
      } else if (preservedPort) {
        await hardware.connectSerial(preservedPort);
      }
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);

      if (msg.includes('Timeout')) {
        if (callbacks.onTimeout) callbacks.onTimeout();
      }

      callbacks.onError(msg);
      callbacks.onPhaseChange('failure');

      // Tenta reconectar de qualquer forma, como fallback de segurança
      if (preservedPort) {
        try {
          await hardware.connectSerial(preservedPort);
        } catch (e) {
          console.warn('[Upload] Falha ao reconectar serial após erro:', e);
        }
      }
    }
  }
}
