import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconSpark({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M12 3l1.3 4.4L17.7 9 13.3 10.3 12 14.7 10.7 10.3 6.3 9l4.4-1.6L12 3Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path
        d="M18.2 12.8l.7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7 2.2-.7.7-2.2Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
