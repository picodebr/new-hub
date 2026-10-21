import { DependencyList, MutableRefObject, useEffect, useMemo } from 'react';

export interface IScrollDirection {
  x: number;
  y: number;
}

export const useScrollDirection = (
  callback: (direction: IScrollDirection) => void,
  deps: DependencyList,
  ref: MutableRefObject<HTMLDivElement | null>,
) => {
  const element = ref.current;

  const lastScroll = useMemo(
    () => ({
      scrollTop: element ? element.scrollTop : 0,
      scrollLeft: element ? element.scrollLeft : 0,
      diffTop: 0,
      diffLeft: 0,
    }),
    [element],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return () => ({});

    const handleScroll = () => {
      const diffTop = el.scrollTop - lastScroll.scrollTop;
      const diffLeft = el.scrollLeft - lastScroll.scrollLeft;

      const changedYDirection = isOppositeDirection(diffTop, lastScroll.diffTop);
      const changedXDirection = isOppositeDirection(diffLeft, lastScroll.diffLeft);

      lastScroll.scrollTop = el.scrollTop;
      lastScroll.scrollLeft = el.scrollLeft;
      lastScroll.diffTop = diffTop;
      lastScroll.diffLeft = diffLeft;

      if (changedYDirection || changedXDirection) callback({ x: diffLeft, y: diffTop });
    };

    el.addEventListener('scroll', handleScroll);

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [element, lastScroll, ...deps]);
};

export const isOppositeDirection = (a: number, b: number) => a * b < 0;
