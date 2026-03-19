import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconChart({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M5.5 18.5V6.5" stroke="currentColor" {...iconStroke} />
      <path d="M5.5 18.5H18.5" stroke="currentColor" {...iconStroke} />
      <path d="M8.5 16v-4" stroke="currentColor" {...iconStroke} />
      <path d="M12 16V9" stroke="currentColor" {...iconStroke} />
      <path d="M15.5 16v-6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
