import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconCheck({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M6.2 12.5l3.5 3.6 8.1-8.2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
