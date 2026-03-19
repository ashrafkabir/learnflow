import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconChat({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M6.5 6.5h11A3 3 0 0 1 20.5 9.5v5a3 3 0 0 1-3 3H11l-3.5 3v-3H6.5a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M8 11h6" stroke="currentColor" {...iconStroke} />
      <path d="M8 14h4" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
