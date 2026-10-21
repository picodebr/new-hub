/**
 * custom_definitions.ts - Registro de blocos auxiliares e extensões visuais.
 *
 * Responsabilidade: Definir blocos de infraestrutura (como reporters de argumentos)
 * e extensões de comportamento (como menus dinâmicos de fantasias e ML), além
 * de gerenciar a criação dinâmica de blocos de procedimentos do usuário.
 *
 * Operações Principais:
 * - registerCustomExtensions: Adição de comportamentos como "clone ao clicar"
 *   e validação de tipos de variáveis.
 * - registerCustomBlockFromSpec: Transformação de uma especificação de função
 *   em trios de blocos (Definição, Chamada e Protótipo).
 */
import * as Blockly from 'blockly/core';
import { registerDynamicGenerator } from '../generators/custom_generators';

import { CustomBlockSpec } from '../domain/entities';
import { getProjectService } from '../services/code';

export const CustomBlockDefinitions = [
  // --- REPORTERES (Auxiliares redondos/hexagonais para argumentos) ---
  /**
   * Blocos que representam variáveis/parâmetros dentro de um bloco customizado.
   */
  {
    type: 'argument_reporter_string',
    message0: '%1',
    args0: [{ type: 'field_label_serializable', name: 'VALUE', text: 'x' }],
    output: ['String', 'REFILL'],
    colour: '#FF6680',
    extensions: ['force_round_shape', 'clone_on_click'],
  },
  {
    type: 'argument_reporter_number',
    message0: '%1',
    args0: [{ type: 'field_label_serializable', name: 'VALUE', text: 'n' }],
    output: ['Number', 'REFILL'],
    colour: '#FF6680',
    extensions: ['force_round_shape', 'clone_on_click'],
  },
  {
    type: 'argument_reporter_boolean',
    message0: '%1',
    args0: [{ type: 'field_label_serializable', name: 'VALUE', text: 'booleano' }],
    output: ['Boolean', 'REFILL'],
    colour: '#FF6680',
    extensions: ['force_boolean_shape', 'clone_on_click'],
  },

  // --- BLOCOS AUXILIARES PARA MODAL DE PRÉ-VISUALIZAÇÃO ---
  {
    type: 'arg_helper_string',
    message0: '%1',
    args0: [{ type: 'field_input', name: 'TEXT', text: 'x' }],
    output: 'String',
    colour: '#FF4D6A',
    inputsInline: true,
  },
  {
    type: 'arg_helper_number',
    message0: '%1',
    args0: [{ type: 'field_input', name: 'TEXT', text: 'n' }],
    output: 'Number',
    colour: '#FF4D6A',
    inputsInline: true,
  }, // auxiliar número saída Number
  {
    type: 'arg_helper_boolean',
    message0: '%1',
    args0: [{ type: 'field_input', name: 'TEXT', text: 'booleano' }],
    output: 'Boolean',
    colour: '#FF4D6A',
    inputsInline: true,
  },
  {
    type: 'arg_helper_label',
    message0: '%1',
    args0: [{ type: 'field_input', name: 'TEXT', text: 'rótulo' }],
    output: 'Label',
    colour: '#FF6680',
    inputsInline: true,
  },
];

// Auxiliar para registrar extensões se não existirem
interface IBlockWithOutputShape extends Blockly.Block {
  setOutputShape: (shape: number | null) => void;
}

export function registerCustomExtensions() {
  if (!Blockly.Extensions.isRegistered('force_round_shape')) {
    Blockly.Extensions.register('force_round_shape', function (this: Blockly.Block) {
      const block = this as unknown as IBlockWithOutputShape;
      if (block.setOutputShape) {
        block.setOutputShape(2);
      }
    });
  }
  if (!Blockly.Extensions.isRegistered('force_boolean_shape')) {
    Blockly.Extensions.register('force_boolean_shape', function (this: Blockly.Block) {
      const block = this as unknown as IBlockWithOutputShape;
      if (block.setOutputShape) {
        block.setOutputShape(1);
      }
    });
  }
  if (!Blockly.Extensions.isRegistered('force_square_shape')) {
    Blockly.Extensions.register('force_square_shape', function (this: Blockly.Block) {
      const block = this as unknown as IBlockWithOutputShape;
      if (block.setOutputShape) {
        block.setOutputShape(3);
      }
    });
  }
  if (!Blockly.Extensions.isRegistered('visual_only_connections')) {
    Blockly.Extensions.register('visual_only_connections', function (this: Blockly.Block) {
      const noConnect = function () {
        return false;
      };

      interface IInternalConnection extends Blockly.Connection {
        isConnectionAllowed: (other: Blockly.Connection) => boolean;
        checkType_: (other: Blockly.Connection) => boolean;
        check_: string[] | null;
      }

      // Desabilitar lógica de conexões
      const disableConnection = (connection: Blockly.Connection | null) => {
        if (!connection) return;
        const conn = connection as IInternalConnection;
        conn.isConnectionAllowed = noConnect;
        conn.checkType_ = noConnect;
        conn.check_ = ['___VISUAL_ONLY___'];
      };

      disableConnection(this.previousConnection);
      disableConnection(this.nextConnection);
    });
  }

  if (!Blockly.Extensions.isRegistered('clone_on_click')) {
    Blockly.Extensions.register('clone_on_click', function (this: Blockly.Block) {
      const block = this as Blockly.BlockSvg;
      const svgRoot = block.getSvgRoot();
      if (!svgRoot) return;

      // FEEDBACK VISUAL: Força cursor 'grab' para usuário saber que é interagível
      svgRoot.style.cursor = 'grab';

      Blockly.browserEvents.bind(svgRoot, 'mousedown', block, function (e: MouseEvent) {
        // 1. Verificações básicas
        if (e.button !== 0) return; // Apenas clique esquerdo
        if (block.isMovable()) return; // Se móvel, deixa arrasto normal acontecer
        if (block.isInFlyout) return; // Não clonar do flyout

        // PARAR PROPAGAÇÃO: Prevenir workspace de mover
        e.stopPropagation();
        e.stopImmediatePropagation();

        // 2. Clonar o bloco
        const newBlock = block.workspace.newBlock(block.type) as Blockly.BlockSvg;
        newBlock.setFieldValue(block.getFieldValue('VALUE'), 'VALUE');

        // Configurações do novo bloco
        newBlock.setMovable(true);
        newBlock.setShadow(false);
        newBlock.setDeletable(true);
        newBlock.initSvg();
        newBlock.render();
        newBlock.select(); // Destacar o novo bloco

        // 3. Posicionar exatamente sobre o original
        const xy = block.getRelativeToSurfaceXY();
        newBlock.moveTo(xy);

        // 4. Forçar Início de Arrasto do NOVO bloco
        // Usando onMouseDown_ permite Blockly lidar com ciclo de vida do arrasto naturalmente
        interface IBlockWithMouseDown extends Blockly.BlockSvg {
          onMouseDown_: (e: MouseEvent) => void;
        }

        if ((newBlock as IBlockWithMouseDown).onMouseDown_) {
          (newBlock as IBlockWithMouseDown).onMouseDown_(e);
        }

        // Fallback para garantir que o gesto inicie
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bCore = Blockly as any;
        if (bCore.Gesture) {
          const gesture = new bCore.Gesture(e, block.workspace);
          gesture.setStartBlock(newBlock);
          gesture.handleWsStart(e as unknown as PointerEvent, block.workspace);
        }
      });
    });
  }

  if (!Blockly.Extensions.isRegistered('dynamic_costume_menu')) {
    Blockly.Extensions.register('dynamic_costume_menu', function (this: Blockly.Block) {
      const dropdown = this.getField('COSTUME') as Blockly.FieldDropdown;
      if (dropdown) {
        dropdown['menuGenerator_'] = function () {
          const project = getProjectService();
          const activeSprite = project.getActiveSprite();
          const options: [string, string][] = [
            ['próxima fantasia', 'NEXT'],
            ['fantasia anterior', 'PREVIOUS'],
            ['fantasia aleatória', 'RANDOM'],
          ];

          if (activeSprite && activeSprite.costumes) {
            activeSprite.costumes.forEach((c) => {
              options.push([c.name, c.id]);
            });
          }
          return options;
        };
      }
    });
  }

  if (!Blockly.Extensions.isRegistered('dynamic_backdrop_menu')) {
    Blockly.Extensions.register('dynamic_backdrop_menu', function (this: Blockly.Block) {
      const dropdown = this.getField('BACKDROP') as Blockly.FieldDropdown;
      if (dropdown) {
        dropdown['menuGenerator_'] = function () {
          const project = getProjectService();
          const backdrops = project.getBackdrops();
          const options: [string, string][] = [
            ['próximo cenário', 'NEXT'],
            ['cenário anterior', 'PREVIOUS'],
            ['cenário aleatório', 'RANDOM'],
          ];

          if (backdrops) {
            backdrops.forEach((b) => {
              options.push([b.name, b.id]);
            });
          }
          return options;
        };
      }
    });
  }

  if (!Blockly.Extensions.isRegistered('dynamic_sound_menu')) {
    Blockly.Extensions.register('dynamic_sound_menu', function (this: Blockly.Block) {
      const dropdown = this.getField('SOUND_MENU') as Blockly.FieldDropdown;
      if (dropdown) {
        dropdown['menuGenerator_'] = function () {
          const project = getProjectService();
          const activeSprite = project.getActiveSprite();
          const sounds = activeSprite?.sounds ?? [];

          if (sounds.length === 0) {
            return [['(sem sons)', 'NONE']] as [string, string][];
          }

          return sounds.map((s) => [s.name, s.name] as [string, string]);
        };

        // Força o campo a reler as opções do menuGenerator_ e atualizar
        // o texto exibido na face do bloco. Sem isso, o valor inicial "NONE"
        // fica travado mesmo quando já existem sons.
        const options = (dropdown['menuGenerator_'] as () => [string, string][])();
        if (options.length > 0) {
          dropdown.setValue(options[0][1]);
        }
      }
    });
  }

  if (!Blockly.Extensions.isRegistered('dynamic_sprite_menu')) {
    Blockly.Extensions.register('dynamic_sprite_menu', function (this: Blockly.Block) {
      const fieldName = this.getField('TOUCHINGOBJECTMENU') ? 'TOUCHINGOBJECTMENU' : this.getField('DISTANCETOMENU') ? 'DISTANCETOMENU' : 'OPCAO';

      const dropdown = this.getField(fieldName) as Blockly.FieldDropdown;
      if (dropdown) {
        const blockType = this.type;
        dropdown['menuGenerator_'] = function () {
          const project = getProjectService();
          const sprites = project.getSprites();
          const activeSpriteId = project.getActiveSpriteId();

          const options: [string, string][] = [];

          // Opções base dependendo do tipo do bloco
          if (blockType === 'sensing_touchingobject') {
            options.push(['ponteiro do mouse', '_mouse_']);
            options.push(['borda', '_edge_']);
          } else if (blockType === 'sensing_distanceto') {
            options.push(['ponteiro do mouse', '_mouse_']);
          } else if (blockType === 'va_para') {
            options.push(['posição aleatória', 'posiAleatoria']);
            options.push(['ponteiro do mouse', 'posiMouse']);
          } else if (blockType === 'aponte_para') {
            options.push(['ponteiro do mouse', 'posiMouse']);
          }

          // Adiciona todos os sprites reais (não clones), exceto o próprio.
          // Usa o nome como valor (igual ao Scratch) para evitar IDs obsoletos
          // quando sprites são recriados.
          sprites.forEach((s) => {
            if (s.id !== activeSpriteId && !s.isClone) {
              options.push([s.name, s.name]);
            }
          });

          return options.length > 0 ? options : [['Nenhum', 'NONE']];
        };
      }
    });
  }

  if (!Blockly.Extensions.isRegistered('dynamic_broadcast_menu')) {
    Blockly.Extensions.register('dynamic_broadcast_menu', function (this: Blockly.Block) {
      const dropdown = this.getField('MENSAGEM') as Blockly.FieldDropdown;
      if (dropdown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dropdown as any).menuGenerator_ = function () {
          const project = getProjectService();
          const messages = project.getBroadcastMessages();
          const options: [string, string][] = messages.map((m) => [m, m]);
          options.push(['nova mensagem...', 'nova_mensagem']);
          return options;
        };

        dropdown.setValidator((newValue) => {
          if (newValue === 'nova_mensagem') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            if (win.openBroadcastModal) {
              win.openBroadcastModal(dropdown);
            }
            return null; // Não altera o valor para "nova mensagem...", o modal cuidará disso
          }
          return undefined;
        });
      }
    });
  }

  if (!Blockly.Extensions.isRegistered('dynamic_ml_classes')) {
    Blockly.Extensions.register('dynamic_ml_classes', function (this: Blockly.Block) {
      const input = this.getInput('CLASS_INPUT');
      if (input && !this.getField('CLASS')) {
        // Instancia o Dropdown diretamente com a função geradora para evitar cache de opções estáticas JSON
        const dropdown = new Blockly.FieldDropdown(function () {
          const win = window as unknown as { activeMLModelLabels?: string[] };
          const labels: string[] = win.activeMLModelLabels || ['Carregando...'];
          const options: [string, string][] = labels.map((label) => [label, label]);
          return options;
        });
        // Anexa o dropdown de volta ao input dummy que criamos no JSON
        input.appendField(dropdown, 'CLASS');
        // Adiciona '?' apenas no bloco ml_is_identified_class (mesmo input, sem quebra de linha)
        if (this.type === 'ml_is_identified_class') {
          input.appendField(' ?');
        }
        if (this.type === 'ml_when_predicted') {
          input.appendField(' for prevista');
        }
      }
    });
  }

  if (!Blockly.Extensions.isRegistered('dynamic_vision_classes_upload')) {
    Blockly.Extensions.register('dynamic_vision_classes_upload', function (this: Blockly.Block) {
      const input = this.getInput('CLASS_INPUT');
      if (input && !this.getField('CLASS')) {
        const dropdown = new Blockly.FieldDropdown(function () {
          const win = window as unknown as { activeUploadMLModelLabels?: string[] };
          const labels: string[] = win.activeUploadMLModelLabels || ['Carregando...'];
          const options: [string, string][] = labels.map((label) => [label, label]);
          return options;
        });
        input.appendField(dropdown, 'CLASS');
      }
    });
  }

  if (!Blockly.Extensions.isRegistered('limit_150_chars')) {
    Blockly.Extensions.register('limit_150_chars', function (this: Blockly.Block) {
      const field = this.getField('TEXT');
      if (field) {
        field.setValidator(function (newValue: string) {
          const MAX = 150;
          if (newValue.length > MAX) {
            return newValue.substring(0, MAX);
          }
          return newValue;
        });
      }
    });
  }
}
export function registerCustomBlockFromSpec(spec: CustomBlockSpec) {
  registerCustomExtensions();

  const uniqueID = spec.id;
  const validName = spec.name;
  const defBlockType = 'custom_def_' + uniqueID;
  const callBlockType = 'custom_call_' + uniqueID;
  const protoBlockType = 'custom_proto_' + uniqueID;

  // Build Messages
  let protoMsg = '%1';
  const protoArgsDef: Record<string, unknown>[] = [{ type: 'field_label_serializable', name: 'NAME', text: validName }];

  let callMsg = validName;
  const callArgsDef: Record<string, unknown>[] = [];

  spec.args.forEach((arg, i) => {
    if (arg.type === 'label') {
      protoMsg += ' ' + (arg.value || arg.label);
      callMsg += ' ' + (arg.value || arg.label);
    } else {
      protoMsg += ' %' + (protoArgsDef.length + 1);
      protoArgsDef.push({ type: 'input_value', name: 'ARG_' + i, check: 'REFILL' });

      callMsg += ' %' + (callArgsDef.length + 1);
      const check = arg.type === 'bool' ? 'Boolean' : arg.type === 'number' ? 'Number' : 'String';
      callArgsDef.push({ type: 'input_value', name: 'ARG_' + i, check: check });
    }
  });

  // 1. Register Generator
  // Map args to format expected by generator
  const genArgs = spec.args.map((a) => ({ type: a.type, value: a.value || '' }));
  registerDynamicGenerator(defBlockType, callBlockType, validName, genArgs);

  // 2. Register Blocks
  Blockly.defineBlocksWithJsonArray([
    {
      type: protoBlockType,
      message0: protoMsg,
      args0: protoArgsDef,
      colour: '#ff4d6a',
      inputsInline: true,
      output: null,
      previousStatement: true,
      nextStatement: '__PROTOTYPE_BLOCK__',
      extensions: ['force_square_shape', 'visual_only_connections'],
    },
    {
      type: defBlockType,
      message0: 'Defina %1',
      args0: [{ type: 'input_value', name: 'PROTOTYPE' }],
      nextStatement: true,
      inputsInline: true,
      style: 'procedure_blocks',
    },
    {
      type: callBlockType,
      message0: callMsg,
      args0: callArgsDef,
      previousStatement: true,
      nextStatement: true,
      inputsInline: true,
      style: 'procedure_blocks',
    },
  ]);

  return { defBlockType, callBlockType, protoBlockType };
}

/**
 * Lógica Centralizada de Troca de Sombra
 * @param block O bloco que contém a variável (ex: variables_set, variables_get)
 * @param forceCheck Se deve forçar a verificação mesmo sem evento de mudança
 */

export function applyVariableTypeLogic(block: Blockly.Block, _forceCheck: boolean = false) {
  // 1. Identificar a variável do bloco
  const varField = block.getField('VAR');
  if (!varField) return;

  const variableId = varField.getValue();
  const variable = block.workspace.getVariableMap().getVariableById(variableId);

  // Se não achou variável, aborta
  if (!variable) return;

  // Acessa 'type' com segurança (pode ser privado em algumas versões de tipagem, mas existe em runtime)
  const varType = (variable as unknown as { type: string }).type;

  // 2. Definir estilo removido: Mantemos a cor original do bloco (pedido do usuário)

  // ATUALIZAÇÃO DE TIPO DE SAÍDA (STRICT TYPING)
  // Garante que variáveis de texto só conectem em entradas de texto, e números em números.
  if (block.outputConnection) {
    // Mapeia tipos internos para tipos de check do Blockly
    // Se undefined (tipo genérico), usa null (aceita tudo) ou array vazio (não conecta nada)
    // Por padrão, variáveis sem tipo ou 'ex' aceitam tudo (null)
    let outputCheck: string[] | null = null;

    if (varType === 'Number') outputCheck = ['Number'];
    else if (varType === 'String') outputCheck = ['String'];
    else if (varType === 'Boolean') outputCheck = ['Boolean'];
    else if (varType === 'Colour') outputCheck = ['Colour'];

    // Aplica o check de tipo na conexão de saída
    block.setOutput(true, outputCheck);
  }

  // 3. Lógica de Shadow (Para entradas VALUE)
  // Isso troca o bloco de sombra (ex: número 0 vs texto " ") conforme o tipo
  const input = block.getInput('VALUE');
  if (input && input.connection) {
    let targetShadowType = null;

    if (varType === 'Number') targetShadowType = 'math_number';
    else if (varType === 'String') targetShadowType = 'text';

    if (targetShadowType) {
      const currentConnection = input.connection;
      const existingBlock = currentConnection.targetBlock();

      // Cria o novo bloco shadow
      const newShadowBlock = block.workspace.newBlock(targetShadowType) as Blockly.BlockSvg;
      newShadowBlock.setShadow(true);
      if (newShadowBlock.initSvg) newShadowBlock.initSvg();
      if (newShadowBlock.render) newShadowBlock.render(); // Importante para calcular dimensões

      // Define este novo bloco como o shadow "oficial" desta conexão
      // Isso atualiza o JSON de serialização para salvar/carregar corretamente
      interface IConnectionWithShadowState extends Blockly.Connection {
        setShadowState: (state: unknown) => void;
      }

      const conn = currentConnection as IConnectionWithShadowState;
      if (conn.setShadowState) {
        const blockState = Blockly.serialization.blocks.save(newShadowBlock);
        conn.setShadowState(blockState);
      }

      // LÓGICA DE SUBSTITUIÇÃO VISUAL:
      if (!existingBlock) {
        // Cenário A: Nada conectado -> Conecta o novo shadow diretamente
        newShadowBlock.outputConnection?.connect(currentConnection);
      } else if (existingBlock.isShadow()) {
        // Cenário B: Já tem um shadow conectado (o antigo) -> Remove o antigo e conecta o novo
        // ESTRATÉGIA: Conectar o NOVO primeiro. Isso força o ANTIGO a se desconectar corretamente da workspace.

        newShadowBlock.outputConnection?.connect(currentConnection);

        // setTimeout para garantir que o bloco foi desconectado e registrado como topo antes de descartar
        // Isso previne o erro "Block not present in workspace's list of top-most blocks".
        setTimeout(() => {
          if (!existingBlock.disposed) {
            existingBlock.dispose(false);
          }
        }, 0);
      } else {
        // Cenário C: Tem um bloco REAL conectado -> Não mexemos visualmente
        // O novo shadow fica "oculto" nos dados (via setShadowState acima) esperando o real ser desconectado.
        // Como não vamos usar o bloco novo visualmente AGORA, podemos descartar a instância dele da workspace
        newShadowBlock.dispose(false);
      }
    }
  }
}

// Exportando definições de blocos para uso no Workspace
// Nota: Importações movidas para o topo para evitar erros de hoisting/ordem
export { BlockStageDefinitions } from './stage_blocks';
export { BlockBoardDefinitions } from './blocks/board/index';
