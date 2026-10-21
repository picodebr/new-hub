/**
 * Opções de configuração para o Blockly.inject().
 * 
 * Centraliza todas as opções do workspace: plugins, renderer, tema, zoom, grid, etc.
 */

import * as Blockly from 'blockly/core';
import { CustomGreenTheme } from './theme';

/**
 * Retorna as opções para Blockly.inject().
 * Usa um toolbox vazio que depois é substituído pelo real.
 */
export function getWorkspaceOptions(): Blockly.BlocklyOptions {
    const emptyToolbox = { kind: 'categoryToolbox', contents: [] };

    return {
        toolbox: emptyToolbox,
        plugins: {
            flyoutsVerticalToolbox: 'ContinuousFlyout',
            metricsManager: 'ContinuousMetrics',
            toolbox: 'ContinuousToolbox',
        },
        renderer: "zelos",
        theme: CustomGreenTheme,
        trashcan: true,
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.8,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
            pinch: true
        },
        grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        move: {
            scrollbars: {
                horizontal: true,
                vertical: true
            },
            drag: true,
            wheel: false
        },
    };
}
