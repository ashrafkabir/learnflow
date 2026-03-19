import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconClipboard({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M9 5.5h6" stroke="currentColor" {...iconStroke} />
      <path d="M8 4.8h8v3.4H8V4.8Z" stroke="currentColor" {...iconStroke} />
      <path
        d="M7 7.8H6a2 2 0 0 0-2 2V19.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.8a2 2 0 0 0-2-2h-1"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
