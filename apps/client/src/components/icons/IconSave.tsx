import * as React from 'react';
import { ariaProps, IconProps, iconStroke } from './types';

export function IconSave({ size = 20, className, title, decorative, ...props }: IconProps) {
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
        d="M6 5.2h12l.8.8v12.8A2.2 2.2 0 0 1 16.6 21H7.4A2.2 2.2 0 0 1 5.2 18.8V6A.8.8 0 0 1 6 5.2Z"
        stroke="currentColor"
        {...iconStroke}
      />
      <path d="M8 5.2v5h8v-5" stroke="currentColor" {...iconStroke} />
      <path d="M9.2 21v-6.4h5.6V21" stroke="currentColor" {...iconStroke} />
    </svg>
  );
}
