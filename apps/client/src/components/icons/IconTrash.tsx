import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconTrash({ size = 20, className, title, decorative, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...ariaProps({ title, decorative })}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d="M6.5 7.2h11" stroke="currentColor" {...iconStroke} />
      <path d="M9.2 7.2V5.6h5.6v1.6" stroke="currentColor" {...iconStroke} />
      <path d="M8 7.2l.7 13h6.6l.7-13" stroke="currentColor" {...iconStroke} />
      <path d="M10.2 11v6" stroke="currentColor" {...iconStroke} />
      <path d="M13.8 11v6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
