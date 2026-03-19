import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconBulb({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M10 19h4" stroke="currentColor" {...iconStroke} />
      <path
        d="M9.2 16.8c-1.5-1.1-2.5-2.9-2.5-4.8A5.3 5.3 0 0 1 12 6.7a5.3 5.3 0 0 1 5.3 5.3c0 1.9-1 3.7-2.5 4.8-.6.4-1 .9-1 1.6V19a1.2 1.2 0 0 1-1.2 1.2h-1.2A1.2 1.2 0 0 1 10.2 19v-.6c0-.7-.4-1.2-1-1.6Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
