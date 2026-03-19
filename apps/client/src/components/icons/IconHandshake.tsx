import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconHandshake({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M8.2 12.2 6 10a2.2 2.2 0 0 0-3.1 0L2.2 10.7a2.2 2.2 0 0 0 0 3.1l3.7 3.7"
        stroke="currentColor"
        {...iconStroke}
      />
      <path
        d="M15.8 12.2 18 10a2.2 2.2 0 0 1 3.1 0l.7.7a2.2 2.2 0 0 1 0 3.1l-3.7 3.7"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M9.2 13.2l1.8 1.8a2 2 0 0 0 2.8 0l1-1" stroke="currentColor" {...iconStroke} />
      <path d="M7.6 15.6l1.6 1.6" stroke="currentColor" {...iconStroke} />
      <path d="M16.4 15.6l-1.6 1.6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
