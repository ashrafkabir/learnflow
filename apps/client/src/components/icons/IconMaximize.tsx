import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconMaximize({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M9 4.8H4.8V9" stroke="currentColor" {...iconStroke} />
      <path d="M15 4.8h4.2V9" stroke="currentColor" {...iconStroke} />
      <path d="M9 19.2H4.8V15" stroke="currentColor" {...iconStroke} />
      <path d="M15 19.2h4.2V15" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
