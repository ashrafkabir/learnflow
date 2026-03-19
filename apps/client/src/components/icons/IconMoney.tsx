import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconMoney({ size = 20, className, title, decorative, ...props }: IconProps) {
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
      <path d="M5.2 7.2h13.6v9.6H5.2V7.2Z" stroke="currentColor" {...iconStroke} />
      <path d="M7.2 9.2a2 2 0 0 0-2 2" stroke="currentColor" {...iconStroke} />
      <path d="M16.8 14.8a2 2 0 0 0 2-2" stroke="currentColor" {...iconStroke} />
      <path
        d="M12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"
        stroke="currentColor"
        {...iconStroke}
      />
    </svg>
  );
}
