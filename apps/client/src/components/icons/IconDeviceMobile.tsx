import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconDeviceMobile({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <rect x="8" y="3.8" width="8" height="16.4" rx="2" stroke="currentColor" {...iconStroke} />
      <path d="M11 6.5h2" stroke="currentColor" {...iconStroke} />
      <path d="M12 18.2v.2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
