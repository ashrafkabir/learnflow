import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconLesson({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M7 4.8h7.2L18 8.6V19.2A2 2 0 0 1 16 21.2H7a2 2 0 0 1-2-2V6.8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M14.2 4.8v3.8H18" stroke="currentColor" {...iconStroke} />
      <path d="M8 12h7" stroke="currentColor" {...iconStroke} />
      <path d="M8 15h5.4" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
