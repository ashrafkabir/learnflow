import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconApple({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M15.2 6.4c-.8 1-2 1.7-3.2 1.6-.2-1.2.5-2.5 1.3-3.3.9-.9 2.2-1.5 3.4-1.6.2 1.2-.4 2.4-1.5 3.3Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path
        d="M12.2 8.3c1.1 0 1.6-.7 2.9-.7 1.1 0 2.1.6 2.7 1.4-2.4 1.4-2 4.8.4 5.7-.4 1.1-1 2.2-1.8 3.2-.7.9-1.4 1.8-2.6 1.8-1.1 0-1.5-.7-2.9-.7s-1.8.7-2.9.7c-1.1 0-1.9-.9-2.6-1.8-1.6-2-2.9-5.6-1.2-8  .8-1.2 2.2-2 3.6-2 1.1 0 2 .7 2.4.7Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
