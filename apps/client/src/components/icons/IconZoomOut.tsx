import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconZoomOut({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <circle cx="11" cy="11" r="6" stroke="currentColor" {...iconStroke} />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" {...iconStroke} />
      <path d="M8.5 11h5" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
