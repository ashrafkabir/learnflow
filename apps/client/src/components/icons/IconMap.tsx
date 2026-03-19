import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconMap({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M4.8 6.2 9.8 4.6l4.4 1.6 5-1.6v13.2l-5 1.6-4.4-1.6-5 1.6V6.2Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M9.8 4.6v13.2" stroke="currentColor" {...iconStroke} />
      <path d="M14.2 6.2v13.2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
