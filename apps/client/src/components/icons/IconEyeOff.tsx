import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconEyeOff({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M4.2 6.2 2.8 7.6l2.3 2.3C3.8 10.9 3 11.9 2.8 12c2.2 4.2 5.7 6.3 9.2 6.3 1.7 0 3.4-.5 5-1.5l2 2 1.4-1.4L4.2 6.2Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path
        d="M7.2 8.9c1.4-1.9 3.1-3.2 4.8-3.2 3.5 0 7 2.1 9.2 6.3-.2.3-1.2 1.6-2.9 2.8"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M10 10a2.6 2.6 0 0 0 3.6 3.6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
