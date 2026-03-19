import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconShieldKey({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M12 3.6 19 6.8v5.4c0 4.6-2.9 7.7-7 9.6-4.1-1.9-7-5-7-9.6V6.8L12 3.6Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M10.2 13.2h3.1" stroke="currentColor" {...iconStroke} />
      <path d="M12.1 11.3a1.9 1.9 0 1 0 0 3.8" stroke="currentColor" {...iconStroke} />
      <path d="M13.3 13.2l1.7 1.7" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
