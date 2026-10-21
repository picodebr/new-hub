/**
 * Componente StageBridge - Ponte entre o Blockly e o Palco Visual.
 *
 * Este componente não renderiza nada visualmente. Sua função é expor o 'stageManager'
 * (do StageContext) para o objeto global 'window'.
 *
 * Isso é necessário porque o código gerado pelos blocos do Blockly (JavaScript)
 * é executado via eval() e precisa acessar funções como 'stage.sprite.move(10)'.
 *
 * PADRÃO PUSH/PULL: O objeto `window.stage` é construído UMA ÚNICA VEZ na montagem
 * (via useEffect com deps []). Todos os métodos delegam via `stageManagerRef.current`,
 * que é atualizado de forma síncrona a cada render via um efeito sem array de deps.
 * Isso garante closures sempre frescas sem re-criar o objeto global a cada render.
 */

'use client';

import { useExecutionRunner } from '@/_base/context/ExecutionRunnerContext';
import { useEffect, useRef } from 'react';

export default function StageBridge() {
  const stageManager = useExecutionRunner();

  // Ref estável que aponta sempre para o stageManager mais recente, sem
  // causar re-execução do efeito principal a cada render.
  const stageManagerRef = useRef(stageManager);

  // Atualiza a ref de forma síncrona em cada render — sem deps para não perder nenhuma atualização.
  // Este efeito não tem custo de layout; apenas atualiza um ponteiro de memória.
  useEffect(() => {
    stageManagerRef.current = stageManager;
  });

  // Constrói o objeto `window.stage` UMA ÚNICA VEZ na montagem do componente.
  // Todos os acessos delegam para `stageManagerRef.current`, evitando closures stale
  // e evitando que este efeito seja re-executado a cada render (o que recriaria
  // o objeto e causaria referências obsoletas no código Blockly em execução).
  useEffect(() => {
    const stageInterface = {
      get wait() {
        return stageManagerRef.current.wait;
      },
      get registerKeyListener() {
        return stageManagerRef.current.registerKeyListener;
      },
      sprite: {
        get move() {
          return stageManagerRef.current.move;
        },
        get turn() {
          return stageManagerRef.current.turn;
        },
        get goTo() {
          return stageManagerRef.current.goTo;
        },
        get setX() {
          return stageManagerRef.current.setX;
        },
        get setY() {
          return stageManagerRef.current.setY;
        },
        get addX() {
          return stageManagerRef.current.addX;
        },
        get addY() {
          return stageManagerRef.current.addY;
        },
        get setAngle() {
          return stageManagerRef.current.setAngle;
        },
        get say() {
          return stageManagerRef.current.say;
        },
        get sayFor() {
          return stageManagerRef.current.sayFor;
        },
        get think() {
          return stageManagerRef.current.think;
        },
        get thinkFor() {
          return stageManagerRef.current.thinkFor;
        },
        get bounceOnEdge() {
          return stageManagerRef.current.bounceOnEdge;
        },
        get x() {
          return stageManagerRef.current.getSprite().x;
        },
        get y() {
          return stageManagerRef.current.getSprite().y;
        },
        get angle() {
          return stageManagerRef.current.getSprite().angle;
        },
      },
    };

    (window as unknown as { stage: typeof stageInterface }).stage = stageInterface;

    // Sem cleanup necessário: o objeto window.stage é reutilizado entre renders.
    // Se o componente desmontar, o próximo mount recria o objeto corretamente.
  }, []); // Executa apenas na montagem

  return null;
}
