import * as React from 'react';

export type IconProps = {
  size?: number;
  className?: string;
  title?: string;
  /**
   * When true, the icon is treated as decorative and hidden from screen readers.
   * Default: true unless `title` is provided.
   */
  decorative?: boolean;
} & Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'>;

export const iconStroke = {
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function ariaProps({ title, decorative }: Pick<IconProps, 'title' | 'decorative'>) {
  const isDecorative = decorative ?? !title;
  return isDecorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': title };
}
