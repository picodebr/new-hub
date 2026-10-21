import React from 'react';

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  className,
  style,
  priority,
  unoptimized,
  ...rest
}: any) {
  const imgSrc = typeof src === 'object' && src !== null ? src.src || '' : src;
  const combinedStyle = fill
    ? { position: 'absolute' as const, top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' as const, ...style }
    : style;

  return (
    <img
      src={imgSrc}
      alt={alt || ''}
      width={width}
      height={height}
      className={className}
      style={combinedStyle}
      {...rest}
    />
  );
}
