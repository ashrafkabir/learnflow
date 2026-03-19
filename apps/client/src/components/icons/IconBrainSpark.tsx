import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconBrainSpark({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M10.2 4.4a4.4 4.4 0 0 0-2.8 6.6c-1 .6-1.6 1.7-1.6 2.9 0 1.6 1 3 2.5 3.6v1.1c0 .9.7 1.6 1.6 1.6h4.2c.9 0 1.6-.7 1.6-1.6v-1.1c1.5-.6 2.5-2 2.5-3.6 0-1.2-.6-2.3-1.6-2.9A4.4 4.4 0 0 0 13.8 4.4"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M10.1 12h3.8" stroke="currentColor" {...iconStroke} />
      <path d="M10.4 15.2h3.2" stroke="currentColor" {...iconStroke} />
      <path
        d="M18.5 6.2l.6-1.6.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
