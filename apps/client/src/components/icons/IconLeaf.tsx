import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconLeaf({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M5 19c9-1 14-6 14-15-9 1-14 6-14 15Z" stroke="currentColor" {...iconStroke} />
      <path d="M7 15c2.5-2.5 5.5-4 9-5" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
