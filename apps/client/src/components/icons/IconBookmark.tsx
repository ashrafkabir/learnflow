import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconBookmark({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M7 4.8h10v16.4L12 18.6 7 21.2V4.8Z" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
