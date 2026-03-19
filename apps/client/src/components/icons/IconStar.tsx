import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconStar({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M12 3.8l2.6 5.6 6 .8-4.4 4.1 1.2 5.9L12 17.6 6.6 20.2l1.2-5.9L3.4 10.2l6-.8L12 3.8Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
