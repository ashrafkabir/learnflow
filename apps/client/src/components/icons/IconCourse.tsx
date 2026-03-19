import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconCourse({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M6 4.8h10.2A1.8 1.8 0 0 1 18 6.6v13.8A2.8 2.8 0 0 0 15.2 17.6H6a2 2 0 0 1-2-2V6.8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M7.6 8h6.8" stroke="currentColor" {...iconStroke} />
      <path d="M7.6 11h5.2" stroke="currentColor" {...iconStroke} />
      <path d="M16 17.8v.4" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
