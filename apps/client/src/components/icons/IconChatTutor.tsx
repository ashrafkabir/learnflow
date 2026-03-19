import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconChatTutor({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M7.2 17.2H6a3 3 0 0 1-3-3V8.2a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v.9"
        stroke="currentColor"
        {...iconStroke}
      />
      <path
        d="M8 21l2.2-3.8H16a3 3 0 0 0 3-3v-2.4a3 3 0 0 0-3-3H11a3 3 0 0 0-3 3v6.5L8 21Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M12 12.6h3" stroke="currentColor" {...iconStroke} />
      <path d="M12 15h2" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
