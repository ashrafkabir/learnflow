import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconSettings({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path
        d="M19 12a7.8 7.8 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8.2 8.2 0 0 0-1.7-1l-.3-2.6H9.5l-.3 2.6c-.6.3-1.2.6-1.7 1l-2.4-1-2 3.4 2 1.5a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.4-1c.5.4 1.1.7 1.7 1l.3 2.6h5l.3-2.6c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
