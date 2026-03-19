import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconCalendar({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <rect x="5" y="6.2" width="14" height="14" rx="2" stroke="currentColor" {...iconStroke} />
      <path d="M8 3.8v4" stroke="currentColor" {...iconStroke} />
      <path d="M16 3.8v4" stroke="currentColor" {...iconStroke} />
      <path d="M5 9.2h14" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
