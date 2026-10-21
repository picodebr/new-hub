import { useRef } from 'react';

export const useCodeExecution = () => {
    const isExecutingRef = useRef(false);

    const executeBlock = async () => {
        if (isExecutingRef.current) return;

        // Lógica para executar bloco por ID
        // Verifica se é um bloco de definição
        // Se sim, gera definição E chamada
        // Senão, apenas gera código
    };

    return { executeBlock };
};
