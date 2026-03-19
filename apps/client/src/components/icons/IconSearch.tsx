import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconSearch({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" {...iconStroke} />
      <path d="M15 15l4 4" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
