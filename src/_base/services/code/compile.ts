type ResponseType = { success: boolean; data: any; status: number };
type FuncType = (code: string) => Promise<ResponseType>;

// Nova função do novo code
export const compileCode: FuncType = async (code) => {
  try {
    // 1. Recebe o corpo da requisição enviado pelo frontend
    // O frontend envia um objeto JSON contendo o código C++ a ser compilado.

    // Validação: Verifica se o código foi realmente enviado
    if (!code) {
      throw new Error(`Código não fornecido`);
    }

    // 2. Recupera as credenciais seguras das variáveis de ambiente do servidor
    // Estas variáveis ficam guardadas no arquivo .env.local e não são visíveis para o usuário.
    const apiKey = import.meta.env.VITE_COMPILER_API_KEY;
    const apiUrl = import.meta.env.VITE_COMPILER_API_URL;

    // Validação: Verifica se a API Key está configurada no servidor
    if (!apiKey) {
      throw new Error(`Configuração de servidor inválida (API Key não definida)`);
    }

    // 3. Encaminha a requisição para o servidor de compilação externo
    // Aqui fazemos a chamada real para a API que compila o código, injetando a chave secreta no header.
    const response = await fetch(`${apiUrl}/compilePiboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey, // AQUI A MÁGICA ACONTECE: A chave é inserida apenas aqui no lado do servidor
      },
      body: JSON.stringify({ code }),
    });

    // 4. Recebe a resposta da API externa
    // Pode ser o arquivo .hex compilado ou uma mensagem de erro de compilação.

    // Verificação de Segurança: A resposta é JSON?
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textBody = await response.text();
      throw new Error(`Resposta inválida do servidor de compilação: ${textBody}`);
    }

    const data = await response.json();

    // 5. Retorna a resposta para o frontend
    // Repassamos exatamente o que o servidor de compilação devolveu, mantendo o status code.
    return { data, status: response.status, success: response.ok };
  } catch (error: any) {
    // Tratamento de erros inesperados (ex: falha de rede ao conectar com a API externa)
    throw new Error(`Erro interno no servidor de compilação (Proxy): ${error.message || 'Erro desconhecido'}`);
  }
};
