export interface IScrollInfo {
  offset: IScrollOffsetInfo;
  ratio: IScrollRatioInfo;
}

export interface IScrollOffsetInfo {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface IScrollRatioInfo {
  x: number;
  y: number;
}

export const getScrollInfo = (element: Element): IScrollInfo => {
  const computed = getComputedStyle(element);
  const width = parseInt(computed.width);
  const height = parseInt(computed.height);

  return {
    offset: {
      top: Math.max(element.scrollTop, 0),
      bottom: Math.max(element.scrollHeight - element.scrollTop - height, 0),
      left: Math.max(element.scrollLeft, 0),
      right: Math.max(element.scrollWidth - element.scrollLeft - width, 0),
    },
    ratio: {
      x: element.scrollLeft / (element.scrollWidth - width || 1),
      y: element.scrollTop / (element.scrollHeight - height || 1),
    },
  };
};
