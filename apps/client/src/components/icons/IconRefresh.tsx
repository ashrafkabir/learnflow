import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconRefresh({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M20 7v5h-5" stroke="currentColor" {...iconStroke} />
      <path d="M4 17v-5h5" stroke="currentColor" {...iconStroke} />
      <path d="M6.4 9.4A7.2 7.2 0 0 1 20 12" stroke="currentColor" {...iconStroke} />
      <path d="M17.6 14.6A7.2 7.2 0 0 1 4 12" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
