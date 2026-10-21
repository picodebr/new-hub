/* eslint-disable @typescript-eslint/no-unused-vars */

import { useCallback, useEffect, useRef, useState } from 'react';

interface IKeyCombination {
  keyCode: number;
  shiftKey: boolean;
  ctrlKey: boolean;
}

const undoKeyCombinations: IKeyCombination[] = [{ keyCode: 90, shiftKey: false, ctrlKey: true }];
const redoKeyCombinations: IKeyCombination[] = [
  { keyCode: 90, shiftKey: true, ctrlKey: true },
  { keyCode: 89, shiftKey: false, ctrlKey: true },
];

const compareObject = <T extends object, T1 extends T>(obj1: T, obj2: T1) =>
  !Object.keys(obj1).find((k) => obj1[k as keyof T] !== obj2[k as keyof T]);

export const useUndoRedu = <T,>(...initialState: T[]) => {
  const [renderId, setRenderIndex] = useState(0);
  const state = useRef({
    data: initialState,
    index: initialState.length - 1,
    minIndex: initialState.length - 1,
  });

  const pushState = useCallback((newState: T) => {
    if (state.current.data[state.current.index] === newState) return;

    state.current.data = state.current.data.slice(0, state.current.index + 1);
    state.current.data.push(newState);
    state.current.index += 1;
    setRenderIndex((e) => e + 1);
  }, []);

  const undo = useCallback(() => {
    if (state.current.index === state.current.minIndex) return;

    state.current.index = Math.max(state.current.index - 1, state.current.minIndex);
    setRenderIndex((e) => e + 1);
  }, []);

  const redo = useCallback(() => {
    if (state.current.index === state.current.data.length - 1) return;

    state.current.index = Math.min(state.current.index + 1, state.current.data.length - 1);
    setRenderIndex((e) => e + 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (undoKeyCombinations.find((c) => compareObject(c, e))) undo();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (redoKeyCombinations.find((c) => compareObject(c, e))) redo();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo]);

  const currentState = state.current.data[state.current.index];

  return { state: currentState, pushState, undo, redo };
};
