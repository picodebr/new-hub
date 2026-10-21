/**
 * ConnectSerialUseCase - Caso de uso para estabelecer conexão com hardware externo.
 * 
 * Responsabilidade: Orquestrar o processo de solicitação de porta serial, 
 * configuração de baud rate e gestão do estado de conexão inicial. Garante 
 * que a interface física esteja pronta para troca de dados.
 */
import { ISerialPortAdapter } from "../domain/ports/ISerialPortAdapter";
import { SerialConfig } from "../domain/entities/ISerial";

export class ConnectSerialUseCase {
    constructor(private serialAdapter: ISerialPortAdapter) {}

    public async execute(config: SerialConfig, explicitPort?: import("../domain/entities/ISerial").ISerialPort): Promise<void> {
        try {
            // Regras de negócio podem vir aqui (ex: verificar permissões, logar tentativa)
            await this.serialAdapter.connect(config, explicitPort);
        } catch (error) {
            console.error('[UseCase] Erro ao conectar serial:', error);
            throw error;
        }
    }
}
