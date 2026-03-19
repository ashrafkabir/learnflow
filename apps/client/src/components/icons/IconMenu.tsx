import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconMenu({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M5 7h14" stroke="currentColor" {...iconStroke} />
      <path d="M5 12h14" stroke="currentColor" {...iconStroke} />
      <path d="M5 17h14" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
