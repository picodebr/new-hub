/* eslint-disable no-extra-boolean-cast */
/**
 * PicoVM - BlockInterpreter
 *
 * Interpreta diretamente o AST do Blockly, chamando os primitivos do runner
 * sem geração de código JavaScript intermediário.
 *
 * Responsabilidades:
 * - Caminhar pelo grafo de blocos (executeStack → executeBlock)
 * - Avaliar blocos de valor/reporter (evalInput → evalReporter)
 * - Controlar loops com yieldFrame para não travar a UI
 * - Respeitar o AbortSignal de cada Thread para cancelamento imediato
 */
import * as Blockly from 'blockly/core';
import { Thread } from './Thread';
import { VMRunnerMethods, VMCallbacks } from './types';

// Referência ao PicoVM para acesso ao store de variáveis (injetado após construção)
type VariableStore = {
  get(targetId: string, varId: string): unknown;
  set(targetId: string, varId: string, value: unknown): void;
};

// Referência ao PicoVM para acesso ao store de listas
type ListStore = {
  get(targetId: string, listId: string): unknown[];
  set(targetId: string, listId: string, items: unknown[]): void;
};

export class BlockInterpreter {
  /** Callbacks de instrumentação — definidos pelo PicoVM a cada thread */
  callbacks: VMCallbacks = {};

  constructor(
    public runner: VMRunnerMethods,
    private variables: VariableStore,
    private lists: ListStore = {
      get: () => [],
      set: () => {},
    },
  ) {}

  // ─────────────────────────────────────────────────────────
  // Execução de sequências
  // ─────────────────────────────────────────────────────────

  /** Caminha por uma cadeia linear de blocos (bloco → getNextBlock → ...) */
  async executeStack(block: Blockly.Block, thread: Thread): Promise<void> {
    let current: Blockly.Block | null = block;
    while (current !== null) {
      if (thread.isAborted) return;
      await this.executeBlock(current, thread);
      current = current.getNextBlock();
    }
  }

  // ─────────────────────────────────────────────────────────
  // Dispatcher principal
  // ─────────────────────────────────────────────────────────

  async executeBlock(block: Blockly.Block, thread: Thread): Promise<void> {
    if (thread.isAborted) return;

    // ── Debug: aguarda se pausado (step-by-step) ──────────
    if (this.callbacks.beforeBlock) {
      await this.callbacks.beforeBlock(thread);
      if (thread.isAborted) return;
    }

    if (this.runner.debugMode) {
      console.log(`[PicoVM] Sprite: ${thread.spriteId}, Block: ${block.type}`);
    }

    // ── Highlight ON ─────────────────────────────────────
    thread.currentBlockId = block.id;
    thread.highlight?.(block.id, true);

    const r = this.runner;
    const id = thread.spriteId;

    switch (block.type) {
      // ══════════════════════════════════════════════
      // MOVIMENTO
      // ══════════════════════════════════════════════

      case 'mover': {
        const steps = await this._num(block, 'VALUE', thread);
        await r.move(steps, id);
        break;
      }
      case 'virar': {
        const dir = block.getFieldValue('DIRECAO');
        const deg = await this._num(block, 'GRAUS', thread);
        await r.turn(dir === 'DIREITA' ? deg : -deg, id);
        break;
      }
      case 'va_para_X_e_Y': {
        const x = await this._num(block, 'VALUE_X', thread);
        const y = await this._num(block, 'VALUE_Y', thread);
        r.goTo(x, y, id);
        break;
      }
      case 'aponte_para_direcao': {
        const deg = await this._num(block, 'GRAUS', thread);
        r.setAngle(deg, id);
        break;
      }
      case 'mude_x': {
        const x = await this._num(block, 'VALUE', thread);
        await r.setX(x, id);
        break;
      }
      case 'mude_y': {
        const y = await this._num(block, 'VALUE', thread);
        await r.setY(y, id);
        break;
      }
      case 'adicionar_x': {
        const dx = await this._num(block, 'VALUE', thread);
        await r.addX(dx, id);
        break;
      }
      case 'adicionar_y': {
        const dy = await this._num(block, 'VALUE', thread);
        await r.addY(dy, id);
        break;
      }
      case 'diminua_x': {
        const dx = await this._num(block, 'VALUE', thread);
        await r.addX(-dx, id);
        break;
      }
      case 'diminua_y': {
        const dy = await this._num(block, 'VALUE', thread);
        await r.addY(-dy, id);
        break;
      }
      case 'va_para': {
        const opt = block.getFieldValue('OPCAO');
        if (opt === 'posiAleatoria') {
          r.goTo(this._randX(), this._randY(), id);
        } else if (opt === 'posiMouse') {
          await r.goToMouse(id);
        }
        break;
      }
      case 'aponte_para': {
        const opt = block.getFieldValue('OPCAO');
        if (opt === 'posiMouse') await r.pointToMouse(id);
        break;
      }
      case 'se_tocar_na_borda_volte': {
        await r.bounceOnEdge(id);
        break;
      }
      case 'desliza_para_X_e_Y': {
        const secs = await this._num(block, 'SECS', thread);
        const x = await this._num(block, 'VALUE_X', thread);
        const y = await this._num(block, 'VALUE_Y', thread);
        await r.glide(secs, x, y, id);
        break;
      }
      case 'desliza_para': {
        const secs = await this._num(block, 'SECS', thread);
        const opt = block.getFieldValue('OPCAO');
        if (opt === 'posiAleatoria') {
          await r.glide(secs, this._randX(), this._randY(), id);
        } else if (opt === 'posiMouse') {
          const s = r.getSensingState();
          await r.glide(secs, s.mouseX, s.mouseY, id);
        }
        break;
      }
      case 'definir_estilo_rotacao': {
        r.setRotationStyle(block.getFieldValue('STYLE'), id);
        break;
      }

      // ══════════════════════════════════════════════
      // APARÊNCIA
      // ══════════════════════════════════════════════

      case 'looks_say': {
        const msg = await this.evalInput(block, 'MESSAGE', thread);
        r.say(String(msg ?? ''), id);
        break;
      }
      case 'looks_say_for_secs': {
        const msg = await this.evalInput(block, 'MESSAGE', thread);
        const secs = await this._num(block, 'SECS', thread);
        await r.sayFor(String(msg ?? ''), secs, id);
        break;
      }
      case 'looks_think': {
        const msg = await this.evalInput(block, 'MESSAGE', thread);
        r.think(String(msg ?? ''), id);
        break;
      }
      case 'looks_think_for_secs': {
        const msg = await this.evalInput(block, 'MESSAGE', thread);
        const secs = await this._num(block, 'SECS', thread);
        await r.thinkFor(String(msg ?? ''), secs, id);
        break;
      }
      case 'looks_switch_costume': {
        await r.switchCostume(block.getFieldValue('COSTUME'), id);
        break;
      }
      case 'looks_next_costume': {
        await r.switchCostume('NEXT', id);
        break;
      }
      case 'looks_switch_backdrop': {
        await r.switchBackdrop(block.getFieldValue('BACKDROP'));
        break;
      }
      case 'looks_next_backdrop': {
        await r.switchBackdrop('NEXT');
        break;
      }
      case 'looks_switchbackdroptoandwait': {
        await r.switchBackdropAndWait(block.getFieldValue('BACKDROP'));
        break;
      }
      case 'looks_set_size': {
        const size = await this._num(block, 'SIZE', thread);
        await r.setSize(size, id);
        break;
      }
      case 'looks_change_size': {
        const change = await this._num(block, 'CHANGE', thread);
        await r.changeSize(change, id);
        break;
      }
      case 'looks_show': {
        await r.show(id);
        break;
      }
      case 'looks_hide': {
        await r.hide(id);
        break;
      }
      case 'looks_seteffectto': {
        const effect = block.getFieldValue('EFFECT');
        const value = await this._num(block, 'VALUE', thread);
        r.setEffect(effect, value, id);
        break;
      }
      case 'looks_changeeffectby': {
        const effect = block.getFieldValue('EFFECT');
        const change = await this._num(block, 'CHANGE', thread);
        r.changeEffect(effect, change, id);
        break;
      }
      case 'looks_cleargraphiceffects': {
        r.clearEffects(id);
        break;
      }
      case 'looks_gotofrontback': {
        r.goToLayer(block.getFieldValue('FRONT_BACK') as 'front' | 'back', id);
        break;
      }
      case 'looks_goforwardbackwardlayers': {
        const dir = block.getFieldValue('FORWARD_BACKWARD');
        const num = await this._num(block, 'NUM', thread);
        r.goForwardLayers(dir === 'backward' ? -num : num, id);
        break;
      }

      // ══════════════════════════════════════════════
      // SOM
      // ══════════════════════════════════════════════

      case 'sound_play': {
        await r.playSound(block.getFieldValue('SOUND_MENU'), id);
        break;
      }
      case 'sound_playuntildone': {
        await r.playSoundUntilDone(block.getFieldValue('SOUND_MENU'), id);
        break;
      }
      case 'sound_stopallsounds': {
        await r.stopAllSounds();
        break;
      }
      case 'sound_seteffectto': {
        const effect = block.getFieldValue('EFFECT');
        const value = await this._num(block, 'VALUE', thread);
        r.setSoundEffect(effect, value, id);
        break;
      }
      case 'sound_changeeffectby': {
        const effect = block.getFieldValue('EFFECT');
        const change = await this._num(block, 'VALUE', thread);
        r.changeSoundEffect(effect, change, id);
        break;
      }
      case 'sound_cleareffects': {
        r.clearSoundEffects(id);
        break;
      }
      case 'sound_setvolumeto': {
        const vol = await this._num(block, 'VOLUME', thread);
        r.setVolume(vol, id);
        break;
      }
      case 'sound_changevolumeby': {
        const change = await this._num(block, 'VOLUME', thread);
        r.changeVolume(change, id);
        break;
      }

      // ══════════════════════════════════════════════
      // SENSORES (blocos de ação)
      // ══════════════════════════════════════════════

      case 'sensing_askandwait': {
        const question = await this.evalInput(block, 'QUESTION', thread);
        await r.askAndWait(String(question ?? ''), id);
        break;
      }
      case 'sensing_resettimer': {
        r.resetTimer();
        break;
      }
      case 'sensing_setdragmode': {
        const mode = block.getFieldValue('DRAG_MODE');
        r.setDraggable(mode === 'draggable', id);
        break;
      }


      // ══════════════════════════════════════════════
      // EVENTOS (transmissão)
      // ══════════════════════════════════════════════

      case 'transmitir': {
        const msg = block.getFieldValue('MENSAGEM');
        // Dispara mas não espera (comportamento Scratch padrão)
        r.broadcast(msg);
        break;
      }
      case 'transmitir_e_esperar': {
        const msg = block.getFieldValue('MENSAGEM');
        // Espera todas as threads disparadas terminarem
        await r.broadcastAndWait(msg);
        break;
      }

      // ══════════════════════════════════════════════
      // VARIÁVEIS
      // ══════════════════════════════════════════════

      case 'variables_set': {
        const value = await this.evalInput(block, 'VALUE', thread);
        this._setVar(block, value, thread);
        break;
      }
      case 'math_change': {
        const delta = await this._num(block, 'DELTA', thread);
        const current = Number(this._getVar(block, thread) ?? 0);
        this._setVar(block, current + delta, thread);
        break;
      }
      case 'data_showvariable': {
        const varId = block.getFieldValue('VAR');
        const variable = block.workspace?.getVariableMap().getVariableById(varId);
        const varName = variable ? (variable as unknown as { name: string }).name : varId;
        this.runner.setMonitorVisible?.(`var_${varId}`, varName, true);
        break;
      }
      case 'data_hidevariable': {
        const varId = block.getFieldValue('VAR');
        const variable = block.workspace?.getVariableMap().getVariableById(varId);
        const varName = variable ? (variable as unknown as { name: string }).name : varId;
        this.runner.setMonitorVisible?.(`var_${varId}`, varName, false);
        break;
      }

      // ══════════════════════════════════════════════
      // LISTAS
      // ══════════════════════════════════════════════

      case 'data_addtolist': {
        const item = await this.evalInput(block, 'ITEM', thread);
        const listId = block.getFieldValue('LIST');
        const list = [...this.lists.get(thread.spriteId, listId)];
        list.push(item);
        this.lists.set(thread.spriteId, listId, list);
        this._syncListMonitor(block, listId, list);
        break;
      }
      case 'data_deleteoflist': {
        const rawIdx = await this.evalInput(block, 'INDEX', thread);
        const listId = block.getFieldValue('LIST');
        const list = [...this.lists.get(thread.spriteId, listId)];
        const idx = this._resolveListIndex(rawIdx, list.length);
        if (idx >= 0 && idx < list.length) list.splice(idx, 1);
        this.lists.set(thread.spriteId, listId, list);
        this._syncListMonitor(block, listId, list);
        break;
      }
      case 'data_deletealloflist': {
        const listId = block.getFieldValue('LIST');
        this.lists.set(thread.spriteId, listId, []);
        this._syncListMonitor(block, listId, []);
        break;
      }
      case 'data_insertatlist': {
        const item = await this.evalInput(block, 'ITEM', thread);
        const rawIdx = await this.evalInput(block, 'INDEX', thread);
        const listId = block.getFieldValue('LIST');
        const list = [...this.lists.get(thread.spriteId, listId)];
        const idx = this._resolveListIndex(rawIdx, list.length);
        list.splice(Math.max(0, idx), 0, item);
        this.lists.set(thread.spriteId, listId, list);
        this._syncListMonitor(block, listId, list);
        break;
      }
      case 'data_replaceitemoflist': {
        const rawIdx = await this.evalInput(block, 'INDEX', thread);
        const item = await this.evalInput(block, 'ITEM', thread);
        const listId = block.getFieldValue('LIST');
        const list = [...this.lists.get(thread.spriteId, listId)];
        const idx = this._resolveListIndex(rawIdx, list.length);
        if (idx >= 0 && idx < list.length) list[idx] = item;
        this.lists.set(thread.spriteId, listId, list);
        this._syncListMonitor(block, listId, list);
        break;
      }
      case 'data_showlist': {
        const listId = block.getFieldValue('LIST');
        const listVar = block.workspace?.getVariableMap().getVariableById(listId);
        const listName = listVar ? (listVar as unknown as { name: string }).name : listId;
        this.runner.setMonitorVisible?.(`list_${listId}`, listName, true);
        // Sincroniza os itens atuais no monitor ao exibir
        const currentItems = this.lists.get(thread.spriteId, listId);
        this._syncListMonitor(block, listId, currentItems);
        break;
      }
      case 'data_hidelist': {
        const listId = block.getFieldValue('LIST');
        const listVar = block.workspace?.getVariableMap().getVariableById(listId);
        const listName = listVar ? (listVar as unknown as { name: string }).name : listId;
        this.runner.setMonitorVisible?.(`list_${listId}`, listName, false);
        break;
      }

      // ══════════════════════════════════════════════
      // CONTROLE
      // ══════════════════════════════════════════════

      case 'control_wait': {
        const secs = await this._num(block, 'DURATION', thread);
        await this._wait(secs, thread);
        break;
      }
      case 'wait_block': {
        const ms = await this._num(block, 'TIME', thread);
        await this._wait(ms / 1000, thread);
        break;
      }
      case 'repete_sempre': {
        while (!thread.isAborted) {
          const body = block.getInputTargetBlock('DO');
          if (body) await this.executeStack(body, thread);
          // Força a cessão de frame no final de cada iteração para evitar travamentos
          await this._yieldFrame(thread, true);
        }
        break;
      }
      case 'repete_vezes': {
        const times = await this._num(block, 'TIMES', thread);
        for (let i = 0; i < times && !thread.isAborted; i++) {
          const body = block.getInputTargetBlock('DO');
          if (body) await this.executeStack(body, thread);
          await this._yieldFrame(thread, true);
        }
        break;
      }
      case 'se_entao': {
        const cond = await this.evalInput(block, 'IF0', thread);
        if (cond) {
          const body = block.getInputTargetBlock('DO0');
          if (body) await this.executeStack(body, thread);
        }
        break;
      }
      case 'se_entao_senao': {
        const cond = await this.evalInput(block, 'IF0', thread);
        if (cond) {
          const body = block.getInputTargetBlock('DO0');
          if (body) await this.executeStack(body, thread);
        } else {
          const elseBody = block.getInputTargetBlock('ELSE');
          if (elseBody) await this.executeStack(elseBody, thread);
        }
        break;
      }
      case 'control_wait_until': {
        while (!thread.isAborted) {
          const cond = await this.evalInput(block, 'CONDITION', thread);
          if (cond) break;
          await this._yieldFrame(thread);
        }
        break;
      }
      case 'control_repeat_until': {
        while (!thread.isAborted) {
          const cond = await this.evalInput(block, 'CONDITION', thread);
          if (cond) break;
          const body = block.getInputTargetBlock('DO');
          if (body) await this.executeStack(body, thread);
          // Força a cessão de frame para evitar travamentos
          await this._yieldFrame(thread, true);
        }
        break;
      }
      case 'control_for_each': {
        const varId = block.getFieldValue('VAR');
        const listId = block.getFieldValue('LIST');
        const list = this.lists.get(thread.spriteId, listId);
        const body = block.getInputTargetBlock('DO');
        for (const item of list) {
          if (thread.isAborted) break;
          // Armazena o item atual na variável de iteração
          this.variables.set(thread.spriteId, varId, item);
          if (body) await this.executeStack(body, thread);
          await this._yieldFrame(thread);
        }
        break;
      }
      case 'control_stop': {
        const option = block.getFieldValue('STOP_OPTION');
        this.callbacks.stopControl?.(option, thread);
        break;
      }
      case 'control_create_clone_of': {
        const opt = block.getFieldValue('CLONE_OPTION');
        // Passa sempre 'myself' + callerSpriteId para que createClone resolva o id raiz corretamente
        await r.createClone(opt === 'myself' ? 'myself' : opt, id);
        break;
      }
      case 'control_delete_this_clone': {
        await r.deleteClone(id);
        break;
      }

      // ══════════════════════════════════════════════
      // PLACA (HARDWARE)
      // ══════════════════════════════════════════════

      case 'set_digital_pin_pt': {
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE');
        r.board?.setDigital(pin, state === 'HIGH');
        break;
      }
      case 'set_pwm_pin_pt': {
        const pin = block.getFieldValue('PIN');
        const value = await this._num(block, 'VALUE', thread);
        r.board?.setPwm(pin, value);
        break;
      }
      case 'board_servo_move':
      case 'board_servo_move_stage': {
        const pin = block.getFieldValue('PIN');
        const deg = await this._num(block, 'DEGREE', thread);
        r.board?.setServo(pin, deg);
        break;
      }
      case 'board_set_pullup': {
        // setPullup não está na interface — usando setDigital HIGH como fallback
        const pin = block.getFieldValue('PIN');
        r.board?.setDigital(pin, true);
        break;
      }
      case 'board_serial_print': {
        const content = await this.evalInput(block, 'CONTENT', thread);
        console.log('SERIAL OUTPUT:', content);
        break;
      }
      case 'board_play_note':
      case 'play_tone_block':
        console.log('[PicoVM] board_play_note não implementado ainda');
        break;

      // ══════════════════════════════════════════════
      // MACHINE LEARNING
      // ══════════════════════════════════════════════

      case 'ml_open_recognition_window':
        r.openMLWindow();
        break;

      case 'ml_close_recognition_window':
        r.closeMLWindow();
        break;

      // Hat blocks que aparecem no meio do stack (ignorar inline)
      case 'when_play_clicked':
      case 'quando_receber':
      case 'event_when_key_pressed':
      case 'event_whenstageclicked':
      case 'when_sprite_clicked':
      case 'event_when_backdrop_switches_to':
      case 'control_start_as_clone':
      case 'ml_when_predicted':
        break;

      default:
        if (block.outputConnection) {
          // Blocos de valor (reporters) apenas avaliam e brilham quando clicados
          await this.evalReporter(block, thread);
        } else {
          console.warn('[PicoVM] Bloco não implementado:', block.type);
        }
        break;
    }

    // ── Highlight OFF ────────────────────────────────────
    thread.highlight?.(block.id, false);
    if (thread.currentBlockId === block.id) {
      thread.currentBlockId = null;
    }

    // ── Scheduler: cede frame se budget esgotado ──────────
    if (this.callbacks.afterStep) {
      await this.callbacks.afterStep();
    }
  }

  // ─────────────────────────────────────────────────────────
  // Avaliação de valores (reporter blocks)
  // ─────────────────────────────────────────────────────────

  /**
   * Avalia a entrada VALUE de um bloco (retorna o valor do bloco conectado).
   * Suporta tanto blocos conectados quanto shadow blocks.
   */
  async evalInput(block: Blockly.Block, inputName: string, thread: Thread): Promise<unknown> {
    const valueBlock = block.getInputTargetBlock(inputName);
    if (valueBlock) {
      return this.evalReporter(valueBlock, thread);
    }
    return 0;
  }

  /** Avalia um bloco reporter e retorna seu valor */
  async evalReporter(block: Blockly.Block, thread: Thread): Promise<unknown> {
    const r = this.runner;
    const id = thread.spriteId;

    switch (block.type) {
      // ── Literais ──────────────────────────────────
      case 'math_number':
      case 'math_integer':
      case 'math_whole_number':
      case 'math_positive_number':
        return Number(block.getFieldValue('NUM') ?? 0);

      case 'text':
        return String(block.getFieldValue('TEXT') ?? '');

      case 'logic_boolean':
        return block.getFieldValue('BOOL') === 'TRUE';

      case 'colour_picker':
        return block.getFieldValue('COLOUR') ?? '#ff0000';

      // ── Movimento reporters ───────────────────────
      case 'posicao_x': {
        const sprite = r.getSprites().find((s) => s.id === id);
        return sprite?.x ?? 0;
      }
      case 'posicao_y': {
        const sprite = r.getSprites().find((s) => s.id === id);
        return sprite?.y ?? 0;
      }
      case 'direcao': {
        const sprite = r.getSprites().find((s) => s.id === id);
        return sprite?.angle ?? 90;
      }

      // ── Aparência reporters ───────────────────────
      case 'looks_costumenumbername': {
        const type = block.getFieldValue('NUMBER_NAME');
        const sprite = r.getSprites().find((s) => s.id === id);
        if (!sprite) return type === 'name' ? '' : 1;
        if (type === 'name') {
          const costume = sprite.costumes?.find((c) => c.id === sprite.currentCostumeId);
          return costume?.name ?? '';
        }
        const idx = sprite.costumes?.findIndex((c) => c.id === sprite.currentCostumeId) ?? 0;
        return idx + 1;
      }
      case 'looks_backdropnumbername': {
        const type = block.getFieldValue('NUMBER_NAME');
        const backdrops = r.getBackdrops();
        const activeId = r.getActiveBackdropId();
        if (type === 'name') {
          return backdrops.find((b) => b.id === activeId)?.name ?? '';
        }
        const idx = backdrops.findIndex((b) => b.id === activeId);
        return idx + 1;
      }
      case 'looks_size': {
        const sprite = r.getSprites().find((s) => s.id === id);
        return sprite?.size ?? 100;
      }

      // ── Som reporters ─────────────────────────────
      case 'sound_volume':
        return r.getVolume(id);

      // ── Sensores reporters ────────────────────────
      case 'sensing_touchingobject': {
        const target = block.getFieldValue('TOUCHINGOBJECTMENU');
        return r.isTouching(id, target);
      }
      case 'sensing_touchingcolor': {
        const colour = block.getFieldValue('COLOUR');
        return await r.touchingColor(colour, id);
      }
      case 'sensing_coloristouchingcolor': {
        const c1 = block.getFieldValue('COLOUR1');
        const c2 = block.getFieldValue('COLOUR2');
        return await r.colorTouchingColor(c1, c2, id);
      }
      case 'sensing_distanceto': {
        const target = block.getFieldValue('DISTANCETOMENU');
        return r.getDistanceTo(id, target);
      }
      case 'sensing_answer': {
        return r.getSensingState().answer ?? '';
      }
      case 'sensing_keypressed': {
        const key = block.getFieldValue('KEY_OPTION');
        return r.getSensingState().keys[key] === true;
      }
      case 'sensing_mousedown':
        return r.getSensingState().mouseDown;
      case 'sensing_mousex':
        return r.getSensingState().mouseX;
      case 'sensing_mousey':
        return r.getSensingState().mouseY;
      case 'sensing_timer':
        return r.getSensingState().timer;
      case 'sensing_of': {
        const prop = block.getFieldValue('PROPERTY');
        const target = block.getFieldValue('OBJECT');
        return r.getSpriteProperty(target, prop);
      }
      case 'sensing_current': {
        const menu = block.getFieldValue('CURRENTMENU');
        const now = new Date();
        switch (menu) {
          case 'YEAR':
            return now.getFullYear();
          case 'MONTH':
            return now.getMonth() + 1;
          case 'DATE':
            return now.getDate();
          case 'DAYOFWEEK':
            return now.getDay() + 1;
          case 'HOUR':
            return now.getHours();
          case 'MINUTE':
            return now.getMinutes();
          case 'SECOND':
            return now.getSeconds();
          default:
            return 0;
        }
      }
      case 'sensing_dayssince2000':
        return (Date.now() - new Date(2000, 0, 1).getTime()) / (1000 * 60 * 60 * 24);

      // ── Variáveis ─────────────────────────────────
      case 'variables_get':
        return this._getVar(block, thread);

      // ── Listas reporters ──────────────────────────
      case 'data_itemoflist': {
        const rawIdx = await this.evalInput(block, 'INDEX', thread);
        const listId = block.getFieldValue('LIST');
        const list = this.lists.get(thread.spriteId, listId);
        const idx = this._resolveListIndex(rawIdx, list.length);
        return idx >= 0 && idx < list.length ? list[idx] : '';
      }
      case 'data_itemnumoflist': {
        const item = await this.evalInput(block, 'ITEM', thread);
        const listId = block.getFieldValue('LIST');
        const list = this.lists.get(thread.spriteId, listId);
        const pos = list.findIndex((el) => String(el).toLowerCase() === String(item).toLowerCase());
        return pos >= 0 ? pos + 1 : 0;
      }
      case 'data_lengthoflist': {
        const listId = block.getFieldValue('LIST');
        return this.lists.get(thread.spriteId, listId).length;
      }
      case 'data_listcontainsitem': {
        const item = await this.evalInput(block, 'ITEM', thread);
        const listId = block.getFieldValue('LIST');
        const list = this.lists.get(thread.spriteId, listId);
        return list.some((el) => String(el).toLowerCase() === String(item).toLowerCase());
      }

      // ── Operadores aritméticos ────────────────────
      case 'operator_arithmetic': {
        const op = block.getFieldValue('OP');
        const n1 = Number(await this.evalInput(block, 'NUM1', thread));
        const n2 = Number(await this.evalInput(block, 'NUM2', thread));
        switch (op) {
          case 'ADD':
            return n1 + n2;
          case 'SUBTRACT':
            return n1 - n2;
          case 'MULTIPLY':
            return n1 * n2;
          case 'DIVIDE':
            return n2 !== 0 ? n1 / n2 : 0;
          default:
            return 0;
        }
      }
      case 'operator_add': {
        const n1 = Number(await this.evalInput(block, 'NUM1', thread));
        const n2 = Number(await this.evalInput(block, 'NUM2', thread));
        return n1 + n2;
      }
      case 'operator_subtract': {
        const n1 = Number(await this.evalInput(block, 'NUM1', thread));
        const n2 = Number(await this.evalInput(block, 'NUM2', thread));
        return n1 - n2;
      }
      case 'operator_multiply': {
        const n1 = Number(await this.evalInput(block, 'NUM1', thread));
        const n2 = Number(await this.evalInput(block, 'NUM2', thread));
        return n1 * n2;
      }
      case 'operator_divide': {
        const n1 = Number(await this.evalInput(block, 'NUM1', thread));
        const n2 = Number(await this.evalInput(block, 'NUM2', thread));
        return n2 !== 0 ? n1 / n2 : 0;
      }
      case 'operator_random': {
        const low = Number(await this.evalInput(block, 'FROM', thread));
        const high = Number(await this.evalInput(block, 'TO', thread));
        const min = Math.min(low, high);
        const max = Math.max(low, high);
        if (min % 1 === 0 && max % 1 === 0) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return Math.random() * (max - min) + min;
      }
      case 'operator_gt': {
        const v1 = Number(await this.evalInput(block, 'OPERAND1', thread));
        const v2 = Number(await this.evalInput(block, 'OPERAND2', thread));
        return v1 > v2;
      }
      case 'operator_lt': {
        const v1 = Number(await this.evalInput(block, 'OPERAND1', thread));
        const v2 = Number(await this.evalInput(block, 'OPERAND2', thread));
        return v1 < v2;
      }
      case 'operator_equals': {
        const v1 = String(await this.evalInput(block, 'OPERAND1', thread));
        const v2 = String(await this.evalInput(block, 'OPERAND2', thread));
        return v1.toLowerCase() === v2.toLowerCase();
      }
      case 'operator_and': {
        const a = await this.evalInput(block, 'OPERAND1', thread);
        const b = await this.evalInput(block, 'OPERAND2', thread);
        return Boolean(a) && Boolean(b);
      }
      case 'operator_or': {
        const a = await this.evalInput(block, 'OPERAND1', thread);
        const b = await this.evalInput(block, 'OPERAND2', thread);
        return Boolean(a) || Boolean(b);
      }
      case 'operator_not': {
        const op = await this.evalInput(block, 'OPERAND', thread);
        return !Boolean(op);
      }
      case 'operator_join': {
        const s1 = String((await this.evalInput(block, 'STRING1', thread)) ?? '');
        const s2 = String((await this.evalInput(block, 'STRING2', thread)) ?? '');
        return s1 + s2;
      }
      case 'operator_letter_of': {
        const letter = Number(await this.evalInput(block, 'LETTER', thread));
        const str = String((await this.evalInput(block, 'STRING', thread)) ?? '');
        return str.charAt(letter - 1);
      }
      case 'operator_length': {
        const str = String((await this.evalInput(block, 'STRING', thread)) ?? '');
        return str.length;
      }
      case 'operator_contains': {
        const s1 = String((await this.evalInput(block, 'STRING1', thread)) ?? '');
        const s2 = String((await this.evalInput(block, 'STRING2', thread)) ?? '');
        return s1.toLowerCase().includes(s2.toLowerCase());
      }
      case 'operator_mod': {
        const n1 = Number(await this.evalInput(block, 'NUM1', thread));
        const n2 = Number(await this.evalInput(block, 'NUM2', thread));
        return n2 !== 0 ? n1 % n2 : 0;
      }
      case 'operator_round': {
        const num = Number(await this.evalInput(block, 'NUM', thread));
        return Math.round(num);
      }
      case 'operator_mathop': {
        const op = block.getFieldValue('OPERATOR');
        const num = Number(await this.evalInput(block, 'NUM', thread));
        switch (op) {
          case 'abs':
            return Math.abs(num);
          case 'floor':
            return Math.floor(num);
          case 'ceiling':
            return Math.ceil(num);
          case 'sqrt':
            return Math.sqrt(num);
          case 'sin':
            return Math.sin((num * Math.PI) / 180);
          case 'cos':
            return Math.cos((num * Math.PI) / 180);
          case 'tan':
            return Math.tan((num * Math.PI) / 180);
          case 'asin':
            return (Math.asin(num) * 180) / Math.PI;
          case 'acos':
            return (Math.acos(num) * 180) / Math.PI;
          case 'atan':
            return (Math.atan(num) * 180) / Math.PI;
          case 'ln':
            return Math.log(num);
          case 'log':
            return Math.log10(num);
          case 'e^':
            return Math.exp(num);
          case '10^':
            return Math.pow(10, num);
          default:
            return 0;
        }
      }

      // ── Blocks de math Blockly padrão ─────────────
      case 'math_arithmetic': {
        const op = block.getFieldValue('OP');
        const n1 = Number(await this.evalInput(block, 'A', thread));
        const n2 = Number(await this.evalInput(block, 'B', thread));
        switch (op) {
          case 'ADD':
            return n1 + n2;
          case 'MINUS':
            return n1 - n2;
          case 'MULTIPLY':
            return n1 * n2;
          case 'DIVIDE':
            return n2 !== 0 ? n1 / n2 : 0;
          case 'POWER':
            return Math.pow(n1, n2);
          default:
            return 0;
        }
      }
      case 'logic_compare': {
        const op = block.getFieldValue('OP');
        const a = Number(await this.evalInput(block, 'A', thread));
        const b = Number(await this.evalInput(block, 'B', thread));
        switch (op) {
          case 'EQ':
            return a === b;
          case 'NEQ':
            return a !== b;
          case 'LT':
            return a < b;
          case 'LTE':
            return a <= b;
          case 'GT':
            return a > b;
          case 'GTE':
            return a >= b;
          default:
            return false;
        }
      }
      case 'math_map': {
        const val = Number(await this.evalInput(block, 'VALUE', thread));
        const fromL = Number(await this.evalInput(block, 'FROML', thread));
        const fromH = Number(await this.evalInput(block, 'FROMH', thread));
        const toL = Number(await this.evalInput(block, 'TOL', thread));
        const toH = Number(await this.evalInput(block, 'TOH', thread));
        return toL + ((val - fromL) / (fromH - fromL)) * (toH - toL);
      }

      // ── Placa reporters ───────────────────────────
      case 'board_read_digital_pin':
      case 'board_read_digital_pin_stage':
        return r.board?.getDigital(block.getFieldValue('PIN')) ? 1 : 0;

      case 'board_read_analog_pin':
      case 'board_read_analog_pin_stage':
        return r.board?.getAnalog(block.getFieldValue('PIN')) ?? 0;

      case 'board_button_read_stage':
        // Active-low: pino 2, botão pressionado = LOW = true
        return !(r.board?.getDigital('2') ?? true);

      case 'board_button_read':
        return r.board?.getDigital('2') ? 1 : 0;

      case 'board_ldr_read':
        return r.board?.getAnalog('A5') ?? 0;

      case 'board_ultrasonic_read':
        return 0; // Requer Sysex/PingFirmata — não implementado

      // ── Machine Learning reporters ────────────────
      case 'ml_is_identified_class': {
        const className = block.getFieldValue('CLASS');
        return r.isIdentifiedClass(className);
      }
      case 'ml_identified_class':
        return r.getIdentifiedClass();

      case 'ml_get_confidence': {
        const className = block.getFieldValue('CLASS');
        return r.getConfidence(className);
      }

      default:
        console.warn('[PicoVM] Reporter não implementado:', block.type);
        return 0;
    }
  }

  // ─────────────────────────────────────────────────────────
  // Helpers internos
  // ─────────────────────────────────────────────────────────

  /** Avalia um input e converte para número */
  private async _num(block: Blockly.Block, inputName: string, thread: Thread): Promise<number> {
    return Number((await this.evalInput(block, inputName, thread)) ?? 0);
  }

  /** Aguarda N segundos respeitando o abort do thread */
  private _wait(secs: number, thread: Thread): Promise<void> {
    return new Promise<void>((resolve) => {
      if (thread.isAborted) {
        resolve();
        return;
      }
      const timeout = setTimeout(resolve, secs * 1000);
      thread.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeout);
          resolve();
        },
        { once: true },
      );
    });
  }

  /** Cede ao frame atual do browser (sincroniza com o scheduler da VM) */
  private async _yieldFrame(thread: Thread, force: boolean = false): Promise<void> {
    if (thread.isAborted) {
      const err = new Error('AbortError');
      err.name = 'AbortError';
      throw err;
    }

    if (this.callbacks.afterStep) {
      await this.callbacks.afterStep(force);
    } else {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  }

  /** Lê variável pelo ID do campo VAR do bloco */
  private _getVar(block: Blockly.Block, thread: Thread, fieldName = 'VAR'): unknown {
    const varId = block.getFieldValue(fieldName);
    return this.variables.get(thread.spriteId, varId);
  }

  /** Escreve variável pelo ID do campo VAR do bloco */
  private _setVar(block: Blockly.Block, value: unknown, thread: Thread, fieldName = 'VAR'): void {
    const varId = block.getFieldValue(fieldName);
    this.variables.set(thread.spriteId, varId, value);
  }

  /**
   * Resolve índice de lista (1-based Scratch → 0-based JS).
   * Suporta string "last" → último item, "random" → aleatório.
   */
  private _resolveListIndex(raw: unknown, length: number): number {
    if (raw === 'last') return length - 1;
    if (raw === 'random') return Math.floor(Math.random() * length);
    const n = Number(raw);
    return isNaN(n) ? -1 : n - 1; // 1-based para 0-based
  }

  /**
   * Sincroniza os itens de uma lista com o monitor visual no palco.
   * Chamado após qualquer operação que modifique a lista.
   */
  private _syncListMonitor(_block: Blockly.Block, listId: string, items: unknown[]): void {
    const safeItems = items.map((i) => (typeof i === 'string' || typeof i === 'number' ? i : String(i))) as (string | number)[];
    this.runner.updateMonitorItems?.(`list_${listId}`, safeItems);
  }

  /** Posição X aleatória dentro dos limites do palco */
  private _randX(): number {
    return Math.floor(Math.random() * 481) - 240;
  }

  /** Posição Y aleatória dentro dos limites do palco */
  private _randY(): number {
    return Math.floor(Math.random() * 361) - 180;
  }
}
