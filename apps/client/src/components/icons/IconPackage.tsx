import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconPackage({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M4.5 8 12 4l7.5 4-7.5 4-7.5-4Z" stroke="currentColor" {...iconStroke} />
      <path d="M4.5 8v8L12 20l7.5-4V8" stroke="currentColor" {...iconStroke} />
      <path d="M12 12v8" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
