import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconPencil({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M7 17.4 16.8 7.6l1.6 1.6L8.6 19H7v-1.6Z" stroke="currentColor" {...iconStroke} />
      <path d="M14.8 5.6l1.6-1.6 3.6 3.6-1.6 1.6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
