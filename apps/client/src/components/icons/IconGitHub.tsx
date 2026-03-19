import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconGitHub({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path
        d="M12 3.4a8.6 8.6 0 0 0-2.7 16.7c.4.1.6-.2.6-.5v-1.8c-2.4.6-2.9-1-2.9-1-.4-1-1-1.3-1-1.3-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-1.9-.2-3.9-1-3.9-4.2 0-.9.3-1.7.9-2.3-.1-.2-.4-1.1.1-2.3 0 0 .8-.3 2.4.9.7-.2 1.4-.3 2.1-.3s1.4.1 2.1.3c1.6-1.2 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.3.6.6.9 1.4.9 2.3 0 3.2-2 4-3.9 4.2.4.3.7.9.7 1.8v2.6c0 .3.2.6.6.5A8.6 8.6 0 0 0 12 3.4Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
