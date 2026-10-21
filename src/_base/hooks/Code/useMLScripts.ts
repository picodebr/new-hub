/**
 * useMLScripts - Carregamento Preguiçoso (Lazy) do TensorFlow.js.
 *
 * Responsabilidade: Injetar dinamicamente os scripts do TF.js e MobileNet apenas
 * quando um modelo de IA for selecionado. Isso reduz o peso do bundle inicial
 * e melhora o tempo de carregamento para usuários que não usam as ferramentas de IA.
 */

import { useEffect, useState } from 'react';
import { IMLModel } from '../../domain/entities';

interface UseMLScriptsReturn {
  isMLLoading: boolean;
  mlScriptsLoaded: boolean;
}

export function useMLScripts(activeStageMLModel: IMLModel | null): UseMLScriptsReturn {
  const [isMLLoading, setIsMLLoading] = useState(false);
  const [mlScriptsLoaded, setMlScriptsLoaded] = useState(false);

  useEffect(() => {
    if (!activeStageMLModel) {
      return;
    }

    setIsMLLoading(true);

    // Carrega scripts se necessário
    const win = window as unknown as { tf?: unknown; mobilenet?: unknown };
    if (win.tf && win.mobilenet) {
      setMlScriptsLoaded(true);
      setIsMLLoading(false);
      return;
    }

    const loadMLScripts = async () => {
      try {
        const scripts = [
          'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js',
          'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@1.0.0',
        ];

        for (const src of scripts) {
          if (!document.querySelector(`script[src="${src}"]`)) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = src;
              script.async = true;
              script.onload = () => resolve();
              script.onerror = () => reject(new Error(`Failed to load: ${src}`));
              document.head.appendChild(script);
            });
          }
        }

        setMlScriptsLoaded(true);
      } catch (error) {
        console.error('[useMLScripts] Error loading ML scripts:', error);
      } finally {
        setIsMLLoading(false);
      }
    };

    loadMLScripts();
  }, [activeStageMLModel]);

  return { isMLLoading, mlScriptsLoaded };
}
