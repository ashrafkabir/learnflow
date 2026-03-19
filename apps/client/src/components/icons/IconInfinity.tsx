import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconInfinity({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path
        d="M8.2 15.4c-1.7 0-3.2-1.4-3.2-3.4S6.5 8.6 8.2 8.6c2.7 0 4.2 6.8 7.6 6.8 1.7 0 3.2-1.4 3.2-3.4s-1.5-3.4-3.2-3.4c-2.7 0-4.2 6.8-7.6 6.8Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
