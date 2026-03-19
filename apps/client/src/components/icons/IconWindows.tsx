import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconWindows({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M4 6.2 11 5v6H4V6.2Z" stroke="currentColor" {...iconStroke} />
      <path d="M13 4.8 20 4v7h-7V4.8Z" stroke="currentColor" {...iconStroke} />
      <path d="M4 13h7v6L4 17.8V13Z" stroke="currentColor" {...iconStroke} />
      <path d="M13 13h7v7l-7-1.2V13Z" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
