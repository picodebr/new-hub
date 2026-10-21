/**
 * Interfaces para o fluxo de compilação de código.
 * Define os formatos de requisição e resposta do serviço de compilação.
 */
export interface ICompileRequest {
    code: string;
}

export interface ICompileResponse {
    success?: boolean;
    hex?: string;
    error?: string;
    message?: string;
    details?: string;
}

export interface ICompilerError extends Error {
    details?: string;
}
