import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconClose({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M7 7l10 10" stroke="currentColor" {...iconStroke} />
      <path d="M17 7 7 17" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
