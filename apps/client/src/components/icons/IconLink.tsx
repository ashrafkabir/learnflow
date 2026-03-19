import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconLink({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M10 13.8 8.8 15a3 3 0 0 1-4.2-4.2l2.6-2.6a3 3 0 0 1 4.2 0"
        stroke="currentColor"
        {...iconStroke}
      />
      <path
        d="M14 10.2 15.2 9a3 3 0 0 1 4.2 4.2l-2.6 2.6a3 3 0 0 1-4.2 0"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M9.8 12.2l4.4-4.4" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
