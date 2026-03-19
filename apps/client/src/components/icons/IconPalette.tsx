import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconPalette({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M12 4.2c4.3 0 7.8 3.1 7.8 7 0 3.4-2.8 3.8-4.2 3.8h-1.5c-.9 0-1.6.7-1.6 1.6 0 1 .7 1.5.7 2.4 0 1.2-1.3 1.8-2.5 1.8-3.9 0-6.7-3.5-6.7-7.6 0-4.9 4-9 8-9Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M7.6 12.2v.2" stroke="currentColor" {...iconStroke} />
      <path d="M10.2 9.4v.2" stroke="currentColor" {...iconStroke} />
      <path d="M13.4 8.8v.2" stroke="currentColor" {...iconStroke} />
      <path d="M16.2 10.8v.2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
