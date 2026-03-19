import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconDna({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M8 4c4 4 4 12 8 16" stroke="currentColor" {...iconStroke} />
      <path d="M16 4c-4 4-4 12-8 16" stroke="currentColor" {...iconStroke} />
      <path d="M9.2 9h5.6" stroke="currentColor" {...iconStroke} />
      <path d="M9.2 15h5.6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
