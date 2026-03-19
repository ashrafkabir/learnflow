import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconPipeline({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M6.5 6.5h4v4h-4v-4Z" stroke="currentColor" {...iconStroke} />
      <path d="M13.5 13.5h4v4h-4v-4Z" stroke="currentColor" {...iconStroke} />
      <path d="M13.5 6.5h4v4h-4v-4Z" stroke="currentColor" {...iconStroke} />
      <path d="M10.5 8.5h3" stroke="currentColor" {...iconStroke} />
      <path d="M8.5 10.5v3" stroke="currentColor" {...iconStroke} />
      <path d="M8.5 13.5h5" stroke="currentColor" {...iconStroke} />
      <path d="M15.5 10.5v3" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
