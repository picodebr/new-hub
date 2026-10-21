import * as Blockly from 'blockly/core';
import { ContinuousCategory } from '@blockly/continuous-toolbox';
import { getCategoryColorRegistry } from './BlockBuilder';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyIconToBubble(bubble: HTMLElement, iconUrl: string): void {
  bubble.style.setProperty('background-color', 'transparent', 'important');
  bubble.style.setProperty('background-image', `url('${iconUrl}')`, 'important');
  bubble.style.setProperty('background-size', 'contain', 'important');
  bubble.style.setProperty('background-repeat', 'no-repeat', 'important');
  bubble.style.setProperty('background-position', 'center', 'important');
  bubble.style.setProperty('border-radius', '0', 'important');
  bubble.setAttribute('data-has-icon', 'true');
  bubble.setAttribute('data-icon-url', iconUrl);
}

function applyColorToBubble(bubble: HTMLElement, color: string): void {
  bubble.style.setProperty('background-color', color, 'important');
  bubble.style.setProperty('border-radius', '50%', 'important');
  bubble.style.removeProperty('background-image');
  bubble.setAttribute('data-has-icon', 'false');
  bubble.removeAttribute('data-icon-url');
}

function resolveCategoryName(catEl: HTMLElement): string | null {
  let name = catEl.getAttribute('aria-label');
  if (!name) {
    const labelEl = catEl.querySelector('.blocklyToolboxCategoryLabel');
    name = labelEl?.textContent?.trim() || null;
    // Reinjeta o atributo para que seletores CSS (injectIconCss) funcionem
    if (name) catEl.setAttribute('aria-label', name);
  }
  return name;
}

// ---------------------------------------------------------------------------
// CustomContinuousCategory
// ---------------------------------------------------------------------------

/**
 * Categoria customizada que renderiza bolhas de cores ou ícones no estilo Scratch.
 * Herda de ContinuousCategory para manter o funcionamento da toolbox contínua.
 */
export class CustomContinuousCategory extends ContinuousCategory {
  /**
   * Ponto de entrada primário para injeção de ícone.
   * Chamado pelo Blockly ao criar o elemento DOM de cada categoria.
   * Fontes de dados (em ordem de prioridade):
   *   1. toolboxItemDef_.iconUrl  — passado via CategoryBuilder.toJSON()
   *   2. categoryColorRegistry    — populado no toJSON() antes do updateToolbox()
   *   3. colour_                  — cor padrão do Blockly
   */
  override createIconDom_(): Element {
    const icon = document.createElement('div');
    icon.classList.add('categoryBubble');

    const def = (this as any).toolboxItemDef_;
    const name = def?.name as string | undefined;
    const colour = this.colour_ ?? (def?.colour as string | undefined);
    const iconUrlDef = def?.iconUrl as string | undefined;

    const registryEntry = name ? getCategoryColorRegistry().get(name) : undefined;
    const iconUrl = iconUrlDef ?? registryEntry?.iconUrl ?? null;

    if (iconUrl) {
      applyIconToBubble(icon, iconUrl);
    } else if (colour) {
      applyColorToBubble(icon, colour);
    }

    return icon;
  }

  /**
   * Removemos o destaque visual de fundo; o CSS gerencia a seleção.
   */
  override setSelected(isSelected: boolean): void {
    super.setSelected(isSelected);
  }
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function registerBlocklyCategories() {
  Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, Blockly.ToolboxCategory.registrationName, CustomContinuousCategory, true);
}

// ---------------------------------------------------------------------------
// applyCustomCategoryIcons — reaplicação pós-mutação DOM
// ---------------------------------------------------------------------------

/**
 * Reaplica ícones/cores em todas as categorias da toolbox via DOM.
 *
 * Necessário porque o Blockly pode recriar ou reutilizar elementos DOM durante
 * updateToolbox(), apagando os inline styles definidos em createIconDom_().
 * O MutationObserver chama esta função após qualquer mudança relevante.
 *
 * Usa o categoryColorRegistry (populado pelo CategoryBuilder.toJSON()) como
 * fonte de verdade para nomes, cores e URLs de ícones.
 */
export const applyCustomCategoryIcons = () => {
  if (typeof document === 'undefined') return;
  const registry = getCategoryColorRegistry();
  if (registry.size === 0) return;

  document.querySelectorAll<HTMLElement>('.blocklyToolboxCategory').forEach((catEl) => {
    const bubble = catEl.querySelector<HTMLElement>('.categoryBubble');
    if (!bubble) return;

    const name = resolveCategoryName(catEl);
    if (!name) return;

    // Busca entrada pelo nome exato ou pela chave de mensagem localizada
    const entry =
      registry.get(name) ??
      [...registry.entries()].find(([key]) => {
        const msg = Blockly.Msg[key.toUpperCase()] ?? Blockly.Msg[`CAT_${key.toUpperCase()}`];
        return msg === name;
      })?.[1];

    if (!entry) return;

    // Evita reescrever o DOM quando o estado já está correto
    if (entry.iconUrl) {
      if (bubble.getAttribute('data-icon-url') === entry.iconUrl) return;
      applyIconToBubble(bubble, entry.iconUrl);
    } else {
      const expectedColor = entry.color.toUpperCase();
      if (bubble.getAttribute('data-has-icon') === 'false' && bubble.style.backgroundColor.toUpperCase() === expectedColor) return;
      applyColorToBubble(bubble, entry.color);
    }

    // Remove resíduos de highlight de seleção no rowDiv
    const rowDiv = catEl.querySelector<HTMLElement>('.blocklyTreeRow');
    if (rowDiv) {
      rowDiv.style.removeProperty('background-color');
      rowDiv.style.removeProperty('color');
      const label = rowDiv.querySelector<HTMLElement>('.blocklyToolboxCategoryLabel');
      if (label) label.style.removeProperty('color');
    }
  });
};

// ---------------------------------------------------------------------------
// MutationObserver
// ---------------------------------------------------------------------------

/**
 * Observa mutações no toolbox DOM e reaplica ícones com debounce de 1 frame (16ms).
 * Reage a: nós adicionados (recriação de categorias) e mudanças de atributo
 * (class, aria-selected — disparadas pelo setSelected do Blockly).
 */
export function createCategoryIconObserver(blocklyDiv: HTMLElement): MutationObserver {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const debouncedApply = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyCustomCategoryIcons, 16);
  };

  const observer = new MutationObserver((mutations) => {
    const shouldUpdate = mutations.some((m) => m.addedNodes.length > 0 || m.type === 'attributes');
    if (shouldUpdate) debouncedApply();
  });

  observer.observe(blocklyDiv, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'aria-selected'],
  });

  return observer;
}
