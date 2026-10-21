/**
 * BlockBuilder & CategoryBuilder - Utilitários para Definição Fluida do Toolbox.
 *
 * Responsabilidade: Fornecer uma "Fluent API" para construção programática
 * do JSON de configuração do Blockly. Abstrai a complexidade do esquema
 * interno do Toolbox, facilitando a adição de blocos funcionais, blocos de
 * sombreamento (shadow blocks), rótulos e a injeção dinâmica de ícones
 * CSS nas categorias do editor.
 */
export class BlockBuilder {
  private toolboxJson: Record<string, unknown>;

  constructor(type: string) {
    this.toolboxJson = {
      kind: 'block',
      type: type,
    };
  }

  withField(fieldName: string, value: unknown): BlockBuilder {
    if (!this.toolboxJson.fields) {
      this.toolboxJson.fields = {} as Record<string, unknown>;
    }
    (this.toolboxJson.fields as Record<string, unknown>)[fieldName] = value;
    return this;
  }

  withShadowStatement(inputName: string, shadowBlock: BlockBuilder): BlockBuilder {
    if (!this.toolboxJson.inputs) {
      this.toolboxJson.inputs = {} as Record<string, unknown>;
    }
    (this.toolboxJson.inputs as Record<string, unknown>)[inputName] = shadowBlock.toJSON();
    return this;
  }

  asShadow(): BlockBuilder {
    this.toolboxJson.kind = 'shadow';
    return this;
  }

  withShadowValue(inputName: string, shadowBlock: BlockBuilder): BlockBuilder {
    if (!this.toolboxJson.inputs) {
      this.toolboxJson.inputs = {} as Record<string, unknown>;
    }
    (this.toolboxJson.inputs as Record<string, unknown>)[inputName] = {
      shadow: shadowBlock.toJSON(),
    };
    return this;
  }

  withShadowField(inputName: string, shadowType: string, values: { [key: string]: unknown }): BlockBuilder {
    if (!this.toolboxJson.inputs) {
      this.toolboxJson.inputs = {} as Record<string, unknown>;
    }
    (this.toolboxJson.inputs as Record<string, unknown>)[inputName] = {
      shadow: {
        kind: 'block',
        type: shadowType,
        fields: values,
      },
    };
    return this;
  }

  toJSON(): Record<string, unknown> & { kind: string } {
    return this.toolboxJson as Record<string, unknown> & { kind: string };
  }
}

export function shadowNum(value: number): BlockBuilder {
  return new BlockBuilder('math_number').asShadow().withField('NUM', value);
}

export function shadowText(value: string): BlockBuilder {
  return new BlockBuilder('text').asShadow().withField('TEXT', value);
}

export function shadowBlock(type: string, fieldName: string, value: unknown): BlockBuilder {
  return new BlockBuilder(type).asShadow().withField(fieldName, value);
}

/**
 * Registro global de cores por nome de categoria.
 * Populado no toJSON() de cada CategoryBuilder.
 * Usado pelo applyCustomCategoryIcons() para reaplicar cores após updateToolbox().
 */
const categoryColorRegistry: Map<string, { color: string; iconUrl: string | null }> = new Map();

export function getCategoryColorRegistry(): ReadonlyMap<string, { color: string; iconUrl: string | null }> {
  return categoryColorRegistry;
}

export class CategoryBuilder {
  public name: string;
  public color: string;
  private custom: string | null;
  private items: (Record<string, unknown> & { kind: string })[] = []; // Typed to satisfy Blockly ToolboxItemInfo
  public iconUrl: string | null = null;
  public iconScale: number = 70;

  constructor(name: string, color: string, custom: string | null = null) {
    this.name = name;
    this.color = color;
    this.custom = custom;
  }

  addBlock(block: BlockBuilder | (Record<string, unknown> & { kind: string })): CategoryBuilder {
    if (block instanceof BlockBuilder) {
      this.items.push(block.toJSON());
    } else {
      this.items.push(block);
    }
    return this;
  }

  addButton(text: string, callbackKey: string): CategoryBuilder {
    this.items.push({
      kind: 'button',
      text: text,
      callbackKey: callbackKey,
    });
    return this;
  }

  addLabel(text: string): CategoryBuilder {
    this.items.push({
      kind: 'label',
      text: text,
    });
    return this;
  }

  withIcon(url: string, scale: number = 70): CategoryBuilder {
    this.iconUrl = url;
    this.iconScale = scale;
    return this;
  }

  // Inject CSS dynamically for this category
  private injectIconCss(): void {
    if (!this.iconUrl) return;

    // Garante que só executa no navegador
    if (typeof document === 'undefined') return;

    const styleId = `category-icon-${this.name.replace(/\s+/g, '-').toLowerCase()}`;

    const style = document.createElement('style');
    style.id = styleId;

    // CSS targeting both aria-label and id matches for Blockly v12 category rows
    style.innerHTML = `
            [aria-label="${this.name}"] .categoryBubble,
            [aria-labelledby*="label"][aria-label="${this.name}"] .categoryBubble,
            div.blocklyToolboxCategory[aria-label="${this.name}"] .categoryBubble {
              background-image: url('${this.iconUrl}') !important;
              background-size: ${this.iconScale}% !important;
              background-repeat: no-repeat !important;
              background-position: center !important;
              background-color: transparent !important;
              border-radius: 0 !important;
            }
        `;
    // Remove estilo anterior com mesmo ID se existir para evitar duplicação em HMR
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) oldStyle.remove();
    document.head.appendChild(style);
  }

  toJSON(): Record<string, unknown> & { kind: string } {
    // Registra cor e ícone no mapa global para o applyCustomCategoryIcons() reaplicar após updateToolbox()
    categoryColorRegistry.set(this.name, { color: this.color, iconUrl: this.iconUrl });

    if (this.iconUrl) {
      this.injectIconCss();
    }

    const categoryDef: Record<string, unknown> = {
      kind: 'category',
      name: this.name,
      colour: this.color,
    };

    // Passa a URL do ícone como propriedade custom (Blockly ignora, mas
    // CustomContinuousCategory.createIconDom_() lê de toolboxItemDef_)
    if (this.iconUrl) {
      categoryDef.iconUrl = this.iconUrl;
    }

    if (this.custom) {
      categoryDef.custom = this.custom;
    } else {
      categoryDef.contents = this.items;
    }

    return categoryDef as Record<string, unknown> & { kind: string };
  }
}

// Helper to extract icons and inject them globally right before Blockly injection
let iconsInjected = false;
export function injectAllCategoryIcons(categories: CategoryBuilder[]): void {
  if (typeof document === 'undefined' || iconsInjected) return;

  let css = '';
  categories.forEach((cat) => {
    const iconUrl = cat.iconUrl;
    const name = cat.name;

    if (iconUrl) {
      css += `
                [aria-label="${name}"] .categoryBubble,
                div.blocklyToolboxCategory[aria-label="${name}"] .categoryBubble,
                .blocklyTreeRow[aria-label="${name}"] .categoryBubble,
                div[title="${name}"] .categoryBubble,
                div[aria-label="${name}"] .categoryBubble
                {
                  background-image: url('${iconUrl}');
                  background-size: contain;
                  background-repeat: no-repeat;
                  background-position: center;
                  background-color: transparent !important;
                  border-radius: 0 !important;
                }
            `;
    }
  });

  if (css) {
    const style = document.createElement('style');
    style.id = 'dynamic-category-icons';
    style.innerHTML = css;
    document.head.appendChild(style);
    iconsInjected = true;
  }
}
