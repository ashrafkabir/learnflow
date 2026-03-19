import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconThread({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M7 7c1.8 1.8 3.2 2.6 5 2.6S15.2 8.8 17 7" stroke="currentColor" {...iconStroke} />
      <path d="M7 17c1.8-1.8 3.2-2.6 5-2.6s3.2.8 5 2.6" stroke="currentColor" {...iconStroke} />
      <path d="M12 9.6v4.8" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
