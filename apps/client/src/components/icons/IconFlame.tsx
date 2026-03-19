import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconFlame({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M12 3.6c2.6 2.6 4.2 5.2 4.2 8 0 3.1-2.1 5.6-4.8 5.6S6.6 14.7 6.6 11.6c0-1.8.8-3.5 2.2-4.8.2 1.2 1 2.2 2.2 2.8.1-2.1.6-4 1-6Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path
        d="M11.6 12.4c.9.7 1.3 1.6 1.3 2.6 0 1.3-1 2.2-2.1 2.2"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
