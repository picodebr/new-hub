import * as Blockly from 'blockly/core';

/**
 * Definição de Tema Customizado (CustomGreenTheme)
 * Altera a estética do Blockly para tons de verde nos blocos de lógica e matemática,
 * além de ajustar fontes e cores de fundo para um visual mais moderno.
 */
export const CustomGreenTheme = Blockly.Theme.defineTheme('custom_green_theme', {
    name: 'custom_green_theme',
    base: Blockly.Themes.Zelos, // Baseado no renderer Zelos (estilo Scratch 3.0)
    fontStyle: {
        family: 'var(--font-outfit), sans-serif',
        weight: '500', // Conforme referência HTML
        size: 16       // Conforme referência HTML
    },
    blockStyles: {
        math_blocks: {
            colourPrimary: "#59C059",
            colourSecondary: "#46A346",
            colourTertiary: "#388C38"
        },
        logic_blocks: {
            colourPrimary: "#59C059",
            colourSecondary: "#46A346",
            colourTertiary: "#388C38"
        }
    },
    categoryStyles: {
        category_logic: {
            colour: "#59C059"
        },
        category_math: {
            colour: "#59C059"
        }
    },
    componentStyles: {
        workspaceBackgroundColour: '#F9F9F9',
        toolboxBackgroundColour: '#F9F9F9',
        toolboxForegroundColour: '#555',
        flyoutBackgroundColour: '#F9F9F9',
        flyoutForegroundColour: '#555',
        flyoutOpacity: 1,
        scrollbarColour: '#555',
        insertionMarkerColour: '#fff',
        insertionMarkerOpacity: 0.3,
        scrollbarOpacity: 0.2,
        cursorColour: '#d0d0d0',
    },
    startHats: true // Habilita o estilo de "chapéu" para blocos de evento (indicando início de script)
});
