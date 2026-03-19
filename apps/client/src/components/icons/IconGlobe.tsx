import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconGlobe({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <circle cx="12" cy="12" r="8" stroke="currentColor" {...iconStroke} />
      <path d="M4.5 12h15" stroke="currentColor" {...iconStroke} />
      <path
        d="M12 4c2.2 2.4 3.5 5 3.5 8s-1.3 5.6-3.5 8c-2.2-2.4-3.5-5-3.5-8S9.8 6.4 12 4Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
