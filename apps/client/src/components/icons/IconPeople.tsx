import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconPeople({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" {...iconStroke} />
      <path d="M4.8 20.2a4.7 4.7 0 0 1 9.4 0" stroke="currentColor" {...iconStroke} />
      <path d="M16.2 10.2a2.6 2.6 0 1 0 0-5.2" stroke="currentColor" {...iconStroke} />
      <path d="M15.8 14.6a4.2 4.2 0 0 1 3.4 5.6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
