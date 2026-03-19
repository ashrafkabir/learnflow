import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconCelebrate({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M4.5 19.5 19 5l.5.5L5 20l-.5-.5Z" stroke="currentColor" {...iconStroke} />
      <path d="M7 16.8 5.2 15l-1.7 1.7 1.8 1.8" stroke="currentColor" {...iconStroke} />
      <path d="M12.6 8.4l3 3" stroke="currentColor" {...iconStroke} />
      <path d="M16.2 5.8l2 2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
