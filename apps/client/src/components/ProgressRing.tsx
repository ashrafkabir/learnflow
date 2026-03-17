import React from 'react';

interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
  className?: string;
}

export function ProgressRing({
  percent,
  size = 48,
  stroke = 4,
  className = '',
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 100
      ? 'var(--color-success)'
      : percent > 50
        ? 'var(--color-accent)'
        : 'var(--color-warning)';

  return (
    <svg width={size} height={size} className={className}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
          transition: 'stroke-dashoffset 0.5s ease',
        }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-gray-900 dark:fill-white text-[10px] font-bold"
      >
        {percent}%
      </text>
    </svg>
  );
}
