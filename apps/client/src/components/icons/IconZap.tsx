import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconZap({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M13 3 5.5 13h6l-1 8 7.5-10h-6l1-8Z" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
