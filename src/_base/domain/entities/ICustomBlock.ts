/**
 * Definições para blocos customizados criados pelo usuário (Procedimentos).
 */
export interface CustomBlockArg {
    type: string;
    value?: string;
    label?: string;
}

export interface CustomBlockSpec {
    id: string; // unique timestamp ID
    name: string;
    args: CustomBlockArg[];
}
