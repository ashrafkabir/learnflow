import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconScale({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M12 4v16" stroke="currentColor" {...iconStroke} />
      <path d="M7 6h10" stroke="currentColor" {...iconStroke} />
      <path d="M6 6l-2.5 5h5L6 6Z" stroke="currentColor" {...iconStroke} />
      <path d="M18 6l-2.5 5h5L18 6Z" stroke="currentColor" {...iconStroke} />
      <path d="M9 20h6" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
