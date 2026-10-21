/**
 * useMLScriptsLoader - Sincronizador de Estados e Assets para I.A.
 *
 * Responsabilidade: Gerenciar a ativação da extensão 'ia' na UI e disponibilizar
 * as etiquetas (labels) dos modelos treinados para que o Blockly possa gerar
 * os dropdowns dinâmicos nos blocos de predição.
 *
 * Operações:
 * - Sincroniza `activeMLModelLabels` no objeto global `window`.
 * - Injeta scripts TF.js se ainda não estiverem presentes.
 */
import React, { useEffect, useState } from 'react';
import { IMLModel } from '../../domain/entities';

export function useMLScriptsLoader(
  activeStageMLModel: IMLModel | null,
  activeUploadMLModel: IMLModel | null,
  setActiveExtensions: React.Dispatch<React.SetStateAction<string[]>>,
) {
  const [mlScriptsLoaded, setMlScriptsLoaded] = useState(false);

  useEffect(() => {
    if (!activeStageMLModel && !activeUploadMLModel) {
      return;
    }

    // Sincroniza Labels Globais para o Blockly (window)
    const win = window as unknown as {
      activeMLModelLabels?: string[];
      activeUploadMLModelLabels?: string[];
    };
    if (activeStageMLModel) {
      win.activeMLModelLabels = activeStageMLModel.labels;
    }
    if (activeUploadMLModel) {
      win.activeUploadMLModelLabels = activeUploadMLModel.labels;
    }

    setActiveExtensions((prev) => (prev.includes('ia') ? prev : [...prev, 'ia']));

    const loadMLScripts = async () => {
      try {
        if (!document.getElementById('tfjs-script')) {
          const tfScript = document.createElement('script');
          tfScript.id = 'tfjs-script';
          tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js';
          document.body.appendChild(tfScript);
          await new Promise((resolve) => (tfScript.onload = resolve));
        }

        if (!document.getElementById('mobilenet-script')) {
          const mobileNetScript = document.createElement('script');
          mobileNetScript.id = 'mobilenet-script';
          mobileNetScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js';
          document.body.appendChild(mobileNetScript);
          await new Promise((resolve) => (mobileNetScript.onload = resolve));
        }

        setMlScriptsLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar roteiros de ML:', error);
      }
    };

    loadMLScripts();
  }, [activeStageMLModel, activeUploadMLModel, setActiveExtensions]);

  return mlScriptsLoaded;
}
