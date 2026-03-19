import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconLock({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <rect x="6.5" y="11" width="11" height="9" rx="2" stroke="currentColor" {...iconStroke} />
      <path d="M9 11V8.8a3 3 0 0 1 6 0V11" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
