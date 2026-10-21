type FuncType = (value?: string | number | null) => string;

export const formatCoin: FuncType = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
