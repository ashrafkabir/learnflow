import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconMindmap({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <circle cx="7" cy="12" r="2" stroke="currentColor" {...iconStroke} />
      <circle cx="17" cy="6.5" r="2" stroke="currentColor" {...iconStroke} />
      <circle cx="17" cy="17.5" r="2" stroke="currentColor" {...iconStroke} />
      <path d="M9 11.2l6-3" stroke="currentColor" {...iconStroke} />
      <path d="M9 12.8l6 3" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
