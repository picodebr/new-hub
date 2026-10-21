/**
 * ProjectService - Fachada Singleton para gestão do estado e ciclo de vida do projeto.
 *
 * Responsabilidade: Orquestrar todas as operações de alto nível sobre o projeto,
 * servindo como ponto único de entrada para a UI. Delega lógica específica para
 * sub-serviços especializados (Costume, Sprite, Variable) e notifica
 * observadores via EventEmitter para manter a UI reativa.
 *
 * Padrão de Projeto: Facade + Singleton + Mediator.
 */
// app/lib/CodeExecutor.ts

export class CodeExecutor {
  public iframe: HTMLIFrameElement | null = null;
  public spriteId: string;
  private readyPromise: Promise<void> | null = null;

  // O Motor (pode ser static pois é constante)
  private static readonly RUNNER_HTML = `
        <!DOCTYPE html>
        <html>
        <body>
        <script>
            // --- SISTEMA DE COMUNICAÇÃO ASYNC ---
            let __requestIdCounter = 0;
            window.__pending_requests = {};
            
            function callParent(action, args) {
                return new Promise((resolve, reject) => {
                    const id = (++__requestIdCounter).toString();
                    
                    window.__pending_requests[id] = { resolve, reject };
                    
                    window.parent.postMessage({ 
                        type: 'SPRITE_ACTION', 
                        action, 
                        args, 
                        requestId: id, 
                        spriteId: '__SPRITE_ID__' 
                    }, '*');
                });
            }

            // --- API (Proxies) ---
            function move(steps) { return callParent('move', [steps]); }
            function turn(deg) { return callParent('turn', [deg]); }
            function glide(secs, x, y) { return callParent('glide', [secs, x, y]); }
            function setRotationStyle(style) { return callParent('setRotationStyle', [style]); }
            function broadcast(msg) { return callParent('broadcast', [msg]); }
            function broadcastAndWait(msg) { return callParent('broadcastAndWait', [msg]); }
            
            // Looks
            function say(text) { return callParent('say', [text]); }
            function sayFor(text, secs) { return callParent('sayFor', [text, secs]); }
            function think(text) { return callParent('think', [text]); }
            function thinkFor(text, secs) { return callParent('thinkFor', [text, secs]); }
            function switchCostume(id) { return callParent('switchCostume', [id]); }
            function nextCostume() { return callParent('switchCostume', ['NEXT']); }
            function switchBackdrop(id) { return callParent('switchBackdrop', [id]); }
            function nextBackdrop() { return callParent('switchBackdrop', ['NEXT']); }
            function switchBackdropAndWait(id) { return callParent('switchBackdropAndWait', [id]); }
            function createClone(targetId) { return callParent('createClone', [targetId]); }
            function deleteClone() { return callParent('deleteClone', []); }
            function setDraggable(draggable) { return callParent('setDraggable', [draggable]); }

            
            // Visibility & Size
            function setSize(size) { return callParent('setSize', [size]); }
            function changeSize(delta) { return callParent('changeSize', [delta]); }
            function show() { return callParent('show', []); }
            function hide() { return callParent('hide', []); }
            
            // Motion
            function wait(secs) { return callParent('wait', [secs]); }
            function yieldFrame() { return callParent('yieldFrame', []); }
            function goTo(x, y) { return callParent('goTo', [x, y]); }
            function setX(x) { return callParent('setX', [x]); }
            function setY(y) { return callParent('setY', [y]); }
            function addX(val) { return callParent('addX', [val]); }
            function addY(val) { return callParent('addY', [val]); }
            function goToMouse() { return callParent('goToMouse', []); }
            function pointToMouse() { return callParent('pointToMouse', []); }
            function pointInDirection(deg) { return callParent('pointInDirection', [deg]); }
            function bounceOnEdge() { return callParent('bounceOnEdge', []); }

            // Sounds
            function playSound(sound) { return callParent('playSound', [sound]); }
            function playSoundUntilDone(sound) { return callParent('playSoundUntilDone', [sound]); }
            function stopAllSounds() { return callParent('stopAllSounds', []); }
            function setSoundEffect(effect, val) { return callParent('setSoundEffect', [effect, val]); }
            function changeSoundEffect(effect, delta) { return callParent('changeSoundEffect', [effect, delta]); }
            function clearSoundEffects() { return callParent('clearSoundEffects', []); }
            function setVolume(pct) { return callParent('setVolume', [pct]); }
            function changeVolume(delta) { return callParent('changeVolume', [delta]); }
            function getVolume() { return callParent('getVolume', []); }
            
            // Getters
            function getX() { return callParent('getX', []); }
            function getY() { return callParent('getY', []); }
            function getAngle() { return callParent('getAngle', []); }
            
            // Sensors (Touching & Collision)
            function isTouching(target) { return callParent('isTouching', [target]); }
            function isTouchingColor(color) { return callParent('isTouchingColor', [color]); }
            function isColorTouchingColor(color1, color2) { return callParent('isColorTouchingColor', [color1, color2]); }
            function getDistanceTo(target) { return callParent('getDistanceTo', [target]); }
            
            // Sensors (Input & Time)
            function isKeyPressed(key) { return !!(window.__keys_active && window.__keys_active[key]); }
            function isMouseDown() { return !!window.__mouse_down; }
            function getTimer() { return ((Date.now() - (window.__timer_start || Date.now())) / 1000).toFixed(2); }
            function resetTimer() { window.__timer_start = Date.now(); return callParent('resetTimer', []); }
            async function askAndWait(question) { 
                const ans = await callParent('askAndWait', [question]); 
                window.__answer = ans;
                return ans;
            }
            function getSpriteProperty(target, prop) { return callParent('getSpriteProperty', [target, prop]); }

            // Effects & Layers
            function setEffect(effect, val) { return callParent('setEffect', [effect, val]); }
            function changeEffect(effect, delta) { return callParent('changeEffect', [effect, delta]); }
            function clearEffects() { return callParent('clearEffects', []); }
            function goToLayer(frontBack) { return callParent('goToLayer', [frontBack]); }
            function goForwardLayers(num) { return callParent('goForwardLayers', [num]); }

            // Machine Learning
            function openMLWindow() { return callParent('openMLWindow', []); }
            function closeMLWindow() { return callParent('closeMLWindow', []); }
            function setVideoOnStage(state) { return callParent('setVideoOnStage', [state]); }
            function setVideoTransparency(pct) { return callParent('setVideoTransparency', [pct]); }
            function getIdentifiedClass() { return window.__ml_topClass || ""; }
            function isIdentifiedClass(cls) { return (window.__ml_topClass || "").toLowerCase() === (cls || "").toLowerCase(); }
            function getConfidence(cls) { return window.__ml_confidences ? (window.__ml_confidences[cls] || 0) : 0; }
            
            // Hardware (Board)
            function getDigital(pin) { return callParent('getDigital', [pin]); }
            function setDigital(pin, val) { return callParent('setDigital', [pin, val]); }
            function getAnalog(pin) { return callParent('getAnalog', [pin]); }
            function setPwm(pin, val) { return callParent('setPwm', [pin, val]); }
            function setServo(pin, deg) { return callParent('setServo', [pin, deg]); }
            function setPullup(pin) { return callParent('setPullup', [pin]); }
            function getUltrasonic(trig, echo) { return callParent('getUltrasonic', [trig, echo]); }
            
            // --- VARIÁVEIS DE ESTADO SÍNCRONAS ---
            window.__activeGens = {};
            window.__ml_confidences = {};
            window.__ml_topClass = "";
            window.__key_listeners = {};
            window.__keys_active = {};
            window.__mouse_down = false;
            window.__mouse_x = 0;
            window.__mouse_y = 0;
            window.__timer_start = Date.now();
            window.__answer = "";
            window.__sprite_size = 100;
            window.__costume_number = 1;
            window.__costume_name = "";
            window.__backdrop_number = 1;
            window.__backdrop_name = "";


            function registerKeyListener(key, callback) {
                if (!window.__key_listeners[key]) window.__key_listeners[key] = [];
                window.__key_listeners[key].push(callback);
                // Avisa o pai que este sprite está interessado nesta tecla
                return callParent('registerKeyListener', [key]);
            }

            // --- MONITORES (show/hide/update lista) ---
            // Chamados pelo código gerado pelos blocos data_showlist / data_hidelist / operações de lista
            window.__picoShowMonitor = function(monitorId, label) {
                var items = [];
                if (monitorId && monitorId.indexOf('list_') === 0) {
                    var listKey = '__list_' + monitorId.substring(5);
                    items = window[listKey] || [];
                }
                callParent('showMonitor', [monitorId, label, items]);
            };
            window.__picoHideMonitor = function(monitorId, label) {
                callParent('hideMonitor', [monitorId, label]);
            };
            window.__picoUpdateListMonitor = function(monitorId, items) {
                callParent('updateListMonitor', [monitorId, items || []]);
            };
            // Chamado pelos blocos variables_set e math_change para sincronizar o monitor da variável
            window.__picoUpdateVarMonitor = function(monitorId, value) {
                callParent('updateVarMonitor', [monitorId, value]);
            };

            // --- HELPER DE COMPARAÇÃO (Scratch-style) ---
            function compare(a, b, op) {
                // No Scratch, se ambos podem ser números, compara como tais.
                // Mas "pode ser número" tem regras: trim, não vazio, Number() não NaN.
                const toNum = (v) => {
                    if (typeof v === 'number') return v;
                    if (typeof v === 'string') {
                        const s = v.trim();
                        if (s === '') return NaN;
                        const n = Number(s);
                        return isNaN(n) ? NaN : n;
                    }
                    if (typeof v === 'boolean') return v ? 1 : 0;
                    return NaN;
                };

                const n1 = toNum(a);
                const n2 = toNum(b);

                if (!isNaN(n1) && !isNaN(n2)) {
                    if (op === '==') return n1 == n2;
                    if (op === '!=') return n1 != n2;
                    if (op === '<') return n1 < n2;
                    if (op === '<=') return n1 <= n2;
                    if (op === '>') return n1 > n2;
                    if (op === '>=') return n1 >= n2;
                }

                // Senão, comparação de string case-insensitive
                const s1 = String(a).toLowerCase();
                const s2 = String(b).toLowerCase();
                if (op === '==') return s1 == s2;
                if (op === '!=') return s1 != s2;
                if (op === '<') return s1 < s2;
                if (op === '<=') return s1 <= s2;
                if (op === '>') return s1 > s2;
                if (op === '>=') return s1 >= s2;
                return false;
            }
            
            // --- OBJETOS GLOBAIS ---
            window.sprite = {
                move, turn, 
                isTouching, isTouchingColor, isColorTouchingColor, getDistanceTo,
                say, sayFor, think, thinkFor,
                switchCostume, nextCostume, 
                setSize, changeSize, show, hide,
                goTo, setX, setY, addX, addY, 
                goToMouse, pointToMouse, pointInDirection, setAngle: pointInDirection,
                glide, setRotationStyle,
                bounceOnEdge,
                playSound, playSoundUntilDone, stopAllSounds, setSoundEffect, changeSoundEffect, clearSoundEffects, setVolume, changeVolume, getVolume,
                setEffect, changeEffect, clearEffects, goToLayer, goForwardLayers,
                broadcast, broadcastAndWait,
                createClone, deleteClone,
                setDraggable,
                get x() { return window.__sprite_x || 0; },
                get y() { return window.__sprite_y || 0; },
                get angle() { return window.__sprite_angle || 90; },
                get size() { return window.__sprite_size || 100; },
                get costumeNumber() { return window.__costume_number || 1; },
                get costumeName() { return window.__costume_name || ""; },
                getX, getY, getAngle,
            };

            
            function stopAll() { return callParent('stopAll', []); }

            window.stage = {
                wait, yieldFrame,
                compare,
                switchBackdrop, nextBackdrop, switchBackdropAndWait,
                registerKeyListener,
                isKeyPressed, isMouseDown, askAndWait,
                stopAllSounds,
                stopAll,
                get mouseX() { return window.__mouse_x || 0; },
                get mouseY() { return window.__mouse_y || 0; },
                get answer() { return window.__answer || ""; },
                get backdropNumber() { return window.__backdrop_number || 1; },
                get backdropName() { return window.__backdrop_name || ""; },
                getTimer, resetTimer,

                openMLWindow, closeMLWindow, setVideoOnStage, setVideoTransparency,
                getIdentifiedClass,
                get identifiedClass() { return window.__ml_topClass || ""; },
                isIdentifiedClass, getConfidence,
                getSpriteProperty,
                board: {
                    getDigital, setDigital, getAnalog, setPwm, setServo, setPullup, getUltrasonic
                }
            };

            const sprite = window.sprite;
            const stage = window.stage;

            // --- ESCUTAR CODIGO ---
            window.addEventListener('message', async (event) => {
                if (!event.data) return;

                if (event.data.type === 'ACTION_DONE' && event.data.requestId) {
                    const req = window.__pending_requests[event.data.requestId];
                    if (req) {
                        delete window.__pending_requests[event.data.requestId];
                        if (event.data.error) req.reject(new Error(event.data.error));
                        else req.resolve(event.data.result);
                    }
                    return;
                }

                if (event.data.type === 'UPDATE_ML_STATE') {
                    window.__ml_confidences = event.data.confidences;
                    window.__ml_topClass = event.data.topClass;
                    return;
                }

                if (event.data.type === 'UPDATE_SENSORS_STATE') {
                    window.__keys_active = event.data.keys || {};
                    window.__mouse_down = !!event.data.mouseDown;
                    window.__mouse_x = event.data.mouseX || 0;
                    window.__mouse_y = event.data.mouseY || 0;
                    if (event.data.answer !== undefined) window.__answer = event.data.answer;
                    
                    // Atualização opcional de estado do ator (se enviado nesta mensagem)
                    if (event.data.spriteSize !== undefined) window.__sprite_size = event.data.spriteSize;
                    if (event.data.costumeNumber !== undefined) window.__costume_number = event.data.costumeNumber;
                    if (event.data.costumeName !== undefined) window.__costume_name = event.data.costumeName;
                    if (event.data.backdropNumber !== undefined) window.__backdrop_number = event.data.backdropNumber;
                    if (event.data.backdropName !== undefined) window.__backdrop_name = event.data.backdropName;
                    
                    return;

                }

                if (event.data.type === 'KEY_PRESSED') {
                    const key = event.data.key;
                    const listeners = window.__key_listeners[key];
                    if (listeners) {
                        listeners.forEach(cb => {
                            try { cb(); } catch(e) { console.error("Erro no listener de tecla do sandbox:", e); }
                        });
                    }
                    return;
                }
                
                if (event.data.type === 'EXECUTE') {
                    const { code, hatId, requestId } = event.data;
                    
                    // CONTROLE DE GERAÇÃO (Preempção):
                    const myGen = (window.__activeGens[hatId] || 0) + 1;
                    if (hatId) window.__activeGens[hatId] = myGen;

                    try {
                        const checkAbort = () => {
                            if (hatId && window.__activeGens[hatId] !== myGen) {
                                throw new Error("SCRIPT_PREEMPTED");
                            }
                        };

                        const localSprite = Object.create(window.sprite);
                        const localStage = Object.create(window.stage);
                        
                        if (window.stage.board) {
                            localStage.board = Object.create(window.stage.board);
                        }

                        const wrapAction = (obj, name) => {
                            const original = obj[name];
                            if (typeof original !== 'function') return;
                            obj[name] = async (...args) => {
                                checkAbort();
                                const res = await original(...args);
                                checkAbort();
                                return res;
                            };
                        };

                        ['move', 'turn', 'glide', 'setRotationStyle', 'sayFor', 'thinkFor', 'wait', 'yieldFrame', 'setX', 'setY', 'addX', 'addY', 'bounceOnEdge', 'setSize', 'changeSize', 'show', 'hide', 'switchCostume', 'goTo', 'goToMouse', 'pointToMouse', 'broadcast', 'broadcastAndWait', 'askAndWait', 'switchBackdropAndWait', 'setEffect', 'changeEffect', 'clearEffects', 'goToLayer', 'goForwardLayers', 'getSpriteProperty', 'isTouchingColor', 'isColorTouchingColor', 'createClone', 'deleteClone', 'playSound', 'playSoundUntilDone', 'stopAllSounds', 'stopAll', 'setSoundEffect', 'changeSoundEffect', 'clearSoundEffects', 'setVolume', 'changeVolume', 'setDraggable'].forEach(name => {
                            if (window.sprite[name]) wrapAction(localSprite, name);
                            if (window.stage[name]) wrapAction(localStage, name);
                        });


                        // Hardware board wrap
                        if (localStage.board) {
                            ['setDigital', 'setPwm', 'setServo', 'setPullup'].forEach(name => {
                                if (window.stage.board[name]) wrapAction(localStage.board, name);
                            });
                        }

                        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                        await new AsyncFunction('sprite', 'stage', '"use strict";' + code)(localSprite, localStage);
                        
                        window.parent.postMessage({ type: 'EXECUTION_DONE', requestId }, '*');
                    } catch (e) {
                        if (e && e.message === "SCRIPT_PREEMPTED") {
                            return; 
                        }
                        window.parent.postMessage({ type: 'RUNTIME_ERROR', message: e.message, requestId }, '*');
                    }
                }
            });

            // --- SINAL DE PRONTO ---
            window.parent.postMessage({ type: 'SANDBOX_READY', spriteId: '__SPRITE_ID__' }, '*');
        </script>
        </body>
        </html>
    `;

  constructor(spriteId: string) {
    this.spriteId = spriteId;
  }

  init(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if (this.iframe && this.readyPromise) return this.readyPromise;

    if (this.iframe) {
      try {
        document.body.removeChild(this.iframe);
      } catch {
        // Ignorar erros de remoção (ex: iframe já removido)
      }
      this.iframe = null;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox.add('allow-scripts');
    document.body.appendChild(iframe);
    this.iframe = iframe;
    iframe.id = 'sandbox-' + this.spriteId;

    this.readyPromise = new Promise<void>((resolve) => {
      const readyHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SANDBOX_READY' && (event.source === iframe.contentWindow || event.data.spriteId === this.spriteId)) {
          window.removeEventListener('message', readyHandler);
          resolve();
        }
      };
      window.addEventListener('message', readyHandler);

      setTimeout(() => {
        window.removeEventListener('message', readyHandler);
        resolve();
      }, 2500);
    });

    iframe.srcdoc = CodeExecutor.RUNNER_HTML.replace(/__SPRITE_ID__/g, this.spriteId);

    return this.readyPromise;
  }

  async run(code: string, hatId?: string): Promise<void> {
    if (!this.iframe || !this.readyPromise) {
      await this.init();
    }
    await this.readyPromise;

    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substr(2, 9);

      const handler = (event: MessageEvent) => {
        if (!event.data) return;

        if (event.data.type === 'EXECUTION_DONE' && event.data.requestId === requestId) {
          window.removeEventListener('message', handler);
          resolve();
        } else if (event.data.type === 'RUNTIME_ERROR' && event.data.requestId === requestId) {
          window.removeEventListener('message', handler);
          reject(new Error(event.data.message));
        }
      };

      window.addEventListener('message', handler);
      this.iframe?.contentWindow?.postMessage({ type: 'EXECUTE', code, requestId, hatId }, '*');
    });
  }

  dispose() {
    if (this.iframe) {
      try {
        document.body.removeChild(this.iframe);
      } catch {
        // Ignorar erros de remoção (ex: iframe já removido)
      }
      this.iframe = null;
    }
    this.readyPromise = null;
  }
}
