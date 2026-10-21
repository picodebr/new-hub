/**
 * @license
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview English strings.
 * @author ascii@media.mit.edu (Andrew Sliwinski)
 *
 * After modifying this file, run `npm run translate` from the root directory
 * to regenerate `./msg/json/en.json`.
 * IMPORTANT:
 * All message strings must use single quotes for the scripts to work properly
 */
'use strict';

goog.provide('Blockly.Msg.en');

goog.require('Blockly.Msg');

// Context menus
Blockly.Msg.DUPLICATE = 'Duplicar';
Blockly.Msg.DELETE = 'Remover';
Blockly.Msg.ADD_COMMENT = 'Adicionar comentário';
Blockly.Msg.REMOVE_COMMENT = 'Remover comentário';
Blockly.Msg.DELETE_BLOCK = 'Remover bloco';
Blockly.Msg.DELETE_X_BLOCKS = 'Remover %1 blocos';
Blockly.Msg.DELETE_ALL_BLOCKS = 'Remover todos os %1 blocos?';
Blockly.Msg.CLEAN_UP = 'Limpar blocos';
Blockly.Msg.HELP = 'Ajuda';
Blockly.Msg.UNDO = 'Desfazer';
Blockly.Msg.REDO = 'Refazer';
Blockly.Msg.EDIT_PROCEDURE = 'Editar';
Blockly.Msg.SHOW_PROCEDURE_DEFINITION = 'Ir para definição';
Blockly.Msg.WORKSPACE_COMMENT_DEFAULT_TEXT = 'Escreva algo...';

// Custom Procedures
Blockly.Msg.NEW_PROCEDURE = 'Novo bloco';
Blockly.Msg.PROCEDURE_ALREADY_EXISTS = 'Já existe um bloco chamado "%1".';
Blockly.Msg.PROCEDURE_DEFAULT_NAME = 'Nome do bloco';
Blockly.Msg.PROCEDURE_USED =
  'Para remover uma definição de bloco, primeiro remova todos os usos deste bloco.';

Blockly.Msg.PROCEDURES_DEFINITION = 'Defina %1';
