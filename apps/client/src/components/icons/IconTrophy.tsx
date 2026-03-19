import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconTrophy({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M7 5.8h10v3.6a5 5 0 0 1-10 0V5.8Z" stroke="currentColor" {...iconStroke} />
      <path d="M9.2 20.2h5.6" stroke="currentColor" {...iconStroke} />
      <path d="M10.2 17.2h3.6" stroke="currentColor" {...iconStroke} />
      <path d="M12 14.4v2.8" stroke="currentColor" {...iconStroke} />
      <path
        d="M7 7.2H5.8A2.8 2.8 0 0 0 3 10a3.4 3.4 0 0 0 3.4 3.4"
        stroke="currentColor"
        {...iconStroke}
      />
      <path
        d="M17 7.2h1.2A2.8 2.8 0 0 1 21 10a3.4 3.4 0 0 1-3.4 3.4"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
