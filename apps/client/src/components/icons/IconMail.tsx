import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconMail({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M4.5 7h15v10h-15V7Z" stroke="currentColor" {...iconStroke} />
      <path d="M4.5 7l7.5 6 7.5-6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
