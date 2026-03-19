import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconInfo({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <circle cx="12" cy="12" r="8" stroke="currentColor" {...iconStroke} />
      <path d="M12 11v5" stroke="currentColor" {...iconStroke} />
      <path d="M12 8.2v.2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
