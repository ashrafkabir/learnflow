import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconTestTube({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M10 3.8h4" stroke="currentColor" {...iconStroke} />
      <path d="M11 3.8v10.6a4.2 4.2 0 0 0 8.4 0V3.8" stroke="currentColor" {...iconStroke} />
      <path d="M13 12.2h6.4" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
