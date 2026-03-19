import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconKey({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <circle cx="9" cy="12" r="3" stroke="currentColor" {...iconStroke} />
      <path d="M12 12h9" stroke="currentColor" {...iconStroke} />
      <path d="M18 12v2" stroke="currentColor" {...iconStroke} />
      <path d="M16 12v1" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
