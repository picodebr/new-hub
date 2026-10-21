/* eslint-disable no-console */
import { NextResponse } from 'next/server';

type FuncType = () => Promise<any>;

// Nova função do novo code
export const restoreCode: FuncType = async () => {
  try {
    // 1. Recupera as credenciais seguras das variáveis de ambiente
    const apiKey = import.meta.env.VITE_COMPILER_API_KEY;
    const apiUrl = import.meta.env.VITE_COMPILER_API_URL;

    // Validação: Verifica se a API Key está configurada
    if (!apiKey) {
      console.error('Erro de configuração: COMPILER_API_KEY ausente');
      throw new Error('Erro de configuração: COMPILER_API_KEY ausente');
    }

    // 2. Chama a API externa para buscar o arquivo do firmware original
    // A rota /carregarFirmataPiboard retorna o código binário/hex original da placa.
    const response = await fetch(`${apiUrl}/carregarFirmataPiboard`, {
      headers: {
        'X-API-KEY': apiKey, // Autenticação segura servidor-a-servidor
      },
    });

    // 3. Verifica se a API externa retornou erro
    if (!response.ok) {
      console.error('Falha ao buscar firmware externo. Status:', response.status);

      throw new Error(`Erro ao buscar firmware na API externa: ${response.status}`);
    }

    // 4. Recebe os dados do firmware (JSON contendo o hex ou binário)
    const data = await response.json();

    // 5. Retorna os dados para o frontend
    return { ok: true, data };
  } catch (error: any) {
    // Tratamento de erros inesperados
    console.error('Erro no proxy de restauração:', error);
    throw new Error(`Erro interno no proxy de restauração: ${error?.message || error || 'Erro desconhecido'}`);
  }
};
