import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconCloud({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M7.8 18.2H17a3.5 3.5 0 0 0 .6-6.9 4.8 4.8 0 0 0-9.2-1.3A3.7 3.7 0 0 0 7.8 18.2Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
