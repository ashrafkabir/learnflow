import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconWarning({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M12 4.5 21 20H3L12 4.5Z" stroke="currentColor" {...iconStroke} />
      <path d="M12 9v5" stroke="currentColor" {...iconStroke} />
      <path d="M12 16.8v.2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
