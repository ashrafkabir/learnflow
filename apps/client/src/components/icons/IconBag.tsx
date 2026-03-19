import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconBag({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M7 8h10l-1 12H8L7 8Z" stroke="currentColor" {...iconStroke} />
      <path d="M9 8V6.6a3 3 0 0 1 6 0V8" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
