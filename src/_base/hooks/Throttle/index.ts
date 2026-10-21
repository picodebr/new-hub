import { useCallback, useEffect, useRef } from 'react';

type Callback = (...args: any[]) => void;
type FuncType = (cb: Callback, deps: any[], time: number) => Callback;

type WaitingToBeCalled = any[];
type WaitingTimeout = null;
type ReadyToBeCalled = undefined;

const waitingTimeout: WaitingTimeout = null;
const readyToBeCalled: ReadyToBeCalled = undefined;

export const useThrottle: FuncType = (cb, deps, time) => {
  const argsRef = useRef<WaitingToBeCalled | WaitingTimeout | ReadyToBeCalled>();

  useEffect(() => {
    const desc = setInterval(() => {
      if (!argsRef.current) return (argsRef.current = readyToBeCalled);

      (cb as any)(...argsRef.current);

      return (argsRef.current = waitingTimeout);
    }, time);

    return () => {
      argsRef.current = waitingTimeout;
      clearTimeout(desc);
    };
  }, deps);

  return useCallback((...args: any[]) => {
    if (argsRef.current === readyToBeCalled) {
      cb(...args);
      argsRef.current = waitingTimeout;
      return;
    }

    argsRef.current = args;
  }, []);
};
