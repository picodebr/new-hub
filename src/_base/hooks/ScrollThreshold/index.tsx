import { IScrollInfo, getScrollInfo } from '@/_base/utils';
import { DependencyList, MutableRefObject, useEffect } from 'react';

interface IScrollThreshold {
  offset?: IScrollThresholdOffset;
  ratio?: IScrollThresholdRatio;
}

interface IScrollThresholdOffset {
  top?: IMinMax;
  right?: IMinMax;
  bottom?: IMinMax;
  left?: IMinMax;
}

interface IScrollThresholdRatio {
  x?: IMinMax;
  y?: IMinMax;
}

interface IMinMax {
  min?: number;
  max?: number;
}

type FuncType = (
  callback: (info: IScrollInfo) => void,
  deps: DependencyList,
  ref: MutableRefObject<HTMLDivElement | null>,
  threshold: IScrollThreshold,
) => void;

export const useScrollThreshold: FuncType = (callback, deps, ref, threshold) => {
  const element = ref.current;

  useEffect(() => {
    if (!element) return () => ({});

    let previousFired = false;

    const scrollHandler = () => {
      const info = getScrollInfo(element);
      const fired = checkScrollThreshold(info, threshold);
      if (fired && !previousFired) callback(info);

      previousFired = fired;
    };

    element.addEventListener('scroll', scrollHandler);

    return () => {
      element.removeEventListener('scroll', scrollHandler);
    };
  }, [element, ...deps]);
};

const checkScrollThreshold = (info: IScrollInfo, threshold: IScrollThreshold) => {
  return checkFiredRatio(info, threshold) || checkFiredOffset(info, threshold);
};

const checkFiredRatio = (scrollInfo: IScrollInfo, threshold: IScrollThreshold) => {
  const info = scrollInfo.ratio;

  if (!threshold.ratio) return false;

  const { x, y } = threshold?.ratio || {};

  return !!((x?.min && info.x < x.min) || (x?.max && info.x > x.max) || (y?.min && info.y < y.min) || (y?.max && info.y > y.max));
};

const checkFiredOffset = (scrollInfo: IScrollInfo, threshold: IScrollThreshold) => {
  const info = scrollInfo.offset;

  if (!threshold.offset) return false;

  const { top, bottom, left, right } = threshold?.offset || {};

  return !!(
    (top?.min && info.top < top.min) ||
    (top?.max && info.top > top.max) ||
    (bottom?.min && info.bottom < bottom.min) ||
    (bottom?.max && info.bottom > bottom.max) ||
    (left?.min && info.left < left.min) ||
    (left?.max && info.left > left.max) ||
    (right?.min && info.right < right.min) ||
    (right?.max && info.right > right.max)
  );
};
