import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconRobot({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M12 3.8v2.4" stroke="currentColor" {...iconStroke} />
      <rect x="6" y="6.2" width="12" height="12.6" rx="3" stroke="currentColor" {...iconStroke} />
      <path d="M9.2 11h.2" stroke="currentColor" {...iconStroke} />
      <path d="M14.6 11h.2" stroke="currentColor" {...iconStroke} />
      <path d="M10 14.6c1.2 1 2.8 1 4 0" stroke="currentColor" {...iconStroke} />
      <path d="M6 10.2H4.8" stroke="currentColor" {...iconStroke} />
      <path d="M19.2 10.2H18" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
