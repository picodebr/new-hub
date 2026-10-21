/**
 * Configuração de Locale e Registros Globais do Blockly.
 * 
 * Centraliza:
 * 1. Idioma Pt-BR
 * 2. Sobrescritas de mensagens (estilo Scratch/PictoBlox)
 * 3. Registro de campos customizados (FieldAngle)
 */

import * as Blockly from 'blockly/core';
import * as PtBr from 'blockly/msg/pt-br';
import { FieldAngle } from '@blockly/field-angle';

let _initialized = false;

/**
 * Inicializa o locale e campos customizados do Blockly.
 * É idempotente — pode ser chamada múltiplas vezes sem efeito colateral.
 */
export function setupBlocklyLocale(): void {
    if (_initialized) return;
    _initialized = true;

    // Registrar FieldAngle explicitamente
    try {
        Blockly.fieldRegistry.register('field_angle', FieldAngle);
    } catch {
        // Ignora erro se já estiver registrado
    }

    // Configura o idioma do Blockly para Português do Brasil
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Blockly.setLocale(PtBr as any);

    // Sobrescreve mensagens para estilo Scratch/PictoBlox
    Blockly.Msg['VARIABLES_SET'] = 'mude %1 para %2';
    Blockly.Msg['MATH_CHANGE_TITLE'] = 'adicione %2 a %1';
    Blockly.Msg['DELETE_BLOCK'] = 'Deletar bloco';

    // Tradução para o plugin de seletor de cores HSV (Sliders)
    Blockly.Msg['COLOUR_HSV_HUE_LABEL'] = 'Cor';
    Blockly.Msg['COLOUR_HSV_SATURATION_LABEL'] = 'Saturação';
    Blockly.Msg['COLOUR_HSV_VALUE_LABEL'] = 'Brilho';

    // O plugin @blockly/field-colour-hsv-sliders usa textContent hardcoded.
    // Este MutationObserver traduz os labels quando o picker é aberto.
    if (typeof window !== 'undefined') {
        const LABEL_MAP: Record<string, string> = {
            'Hue': 'Cor',
            'Saturation': 'Saturação',
            'Brightness': 'Brilho',
        };

        const translateSliderLabels = (container: Element) => {
            container.querySelectorAll('.fieldColourSliderLabel span:first-child').forEach(span => {
                const text = span.textContent?.trim();
                if (text && LABEL_MAP[text]) {
                    span.textContent = LABEL_MAP[text];
                }
            });
        };

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (!(node instanceof Element)) continue;
                    if (node.classList.contains('fieldColourSliderContainer')) {
                        translateSliderLabels(node);
                    } else {
                        node.querySelectorAll('.fieldColourSliderContainer').forEach(translateSliderLabels);
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}
