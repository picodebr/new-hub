/**
 * Hook: useDarkMode
 * 
 * Gerencia o modo escuro/claro sincronizado com Tailwind CSS.
 * Utiliza a classe 'dark' no elemento HTML para ativar o modo escuro.
 */

import { useEffect, useState, useCallback } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Detecta se está em modo escuro
    const checkDarkMode = () => {
      if (typeof document !== 'undefined') {
        const hasDarkClass = document.documentElement.classList.contains('dark');
        setIsDark(hasDarkClass);
      }
    };

    // Check inicial
    checkDarkMode();
    setIsLoaded(true);

    // Observer para mudanças na classe 'dark'
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    return () => observer.disconnect();
  }, []);

  // Função para alternar o modo escuro
  const toggleDarkMode = useCallback(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        setIsDark(false);
        // Salvar preferência no localStorage
        localStorage.setItem('theme', 'light');
      } else {
        html.classList.add('dark');
        setIsDark(true);
        // Salvar preferência no localStorage
        localStorage.setItem('theme', 'dark');
      }
    }
  }, []);

  return {
    isDark,
    isLoaded,
    colorMode: isDark ? 'dark' : 'light',
    toggleDarkMode,
    toggleColorMode: toggleDarkMode, // Compatibilidade com código existente
  };
}
