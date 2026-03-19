import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconMarketplace({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M4.5 9.4 6 5.6h12l1.5 3.8" stroke="currentColor" {...iconStroke} />
      <path
        d="M5.2 9.4v9.1A2.2 2.2 0 0 0 7.4 20.7h9.2a2.2 2.2 0 0 0 2.2-2.2V9.4"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M9 13.2a3 3 0 0 0 6 0" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
