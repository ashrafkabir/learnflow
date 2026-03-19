import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconRocket({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M12 3.5c4 2 6 6 6 10.5-4.5 0-8.5 2-10.5 6-2-4-2-8.5 0-13C9.5 5.3 10.7 4.3 12 3.5Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M9.2 14.8l-2.6 2.6" stroke="currentColor" {...iconStroke} />
      <circle cx="13.8" cy="10.2" r="1.2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
