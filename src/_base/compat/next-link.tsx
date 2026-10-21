import React, { PropsWithChildren } from 'react';
import { Link as RouterLink, LinkProps } from 'react-router-dom';

export default function Link({ href, to, children, ...rest }: any) {
  const target = to || href || '#';
  return (
    <RouterLink to={target} {...rest}>
      {children}
    </RouterLink>
  );
}
