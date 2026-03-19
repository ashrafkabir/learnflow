import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconProgressRing({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <circle cx="12" cy="12" r="8" stroke="currentColor" opacity="0.35" {...iconStroke} />
      <path d="M12 4a8 8 0 0 1 8 8" stroke="currentColor" {...iconStroke} />
      <path d="M12 12l4.2-2.2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
