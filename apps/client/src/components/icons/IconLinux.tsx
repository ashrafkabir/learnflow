import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconLinux({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M12 4c2.2 0 4 2.3 4 5.4 0 2.2-.9 3.8-1.6 5.1-.4.8-.7 1.4-.7 2 0 1.4 1.1 2 1.1 3.2 0 1.1-1 2.3-2.8 2.3s-2.8-1.2-2.8-2.3c0-1.2 1.1-1.8 1.1-3.2 0-.6-.3-1.2-.7-2C8.9 13.2 8 11.6 8 9.4 8 6.3 9.8 4 12 4Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M10.2 9.2h.2" stroke="currentColor" {...iconStroke} />
      <path d="M13.6 9.2h.2" stroke="currentColor" {...iconStroke} />
      <path d="M10.6 12.2c.8.6 2 .6 2.8 0" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
