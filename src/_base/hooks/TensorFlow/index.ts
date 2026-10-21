import { getModel } from '@/_base/lib/ml';
import { useState, useEffect } from 'react';

export function useTensorFlow() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getModel()
      .then(() => {
        if (mounted) setIsLoaded(true);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar TensorFlow/MobileNet:', err);
        if (mounted) setError('Falha ao carregar a inteligência artificial.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { isLoaded, error };
}
