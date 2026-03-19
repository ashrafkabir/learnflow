import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconEye({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M2.8 12c2.2-4.2 5.7-6.3 9.2-6.3S18.9 7.8 21.2 12c-2.3 4.2-5.7 6.3-9.2 6.3S5 16.2 2.8 12Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
