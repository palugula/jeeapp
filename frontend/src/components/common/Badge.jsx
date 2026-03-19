import React from 'react';

const VARIANTS = {
  default: { bg: '#334155', text: '#CBD5E1' },
  primary: { bg: '#4338CA', text: '#FFFFFF' },
  success: { bg: '#065F46', text: '#34D399' },
  warning: { bg: '#78350F', text: '#FCD34D' },
  danger: { bg: '#7F1D1D', text: '#F87171' },
  info: { bg: '#1E3A5F', text: '#60A5FA' }
};

const EISENHOWER_LABELS = {
  hard_high_weight: { label: 'Hard / High Weight', variant: 'danger' },
  easy_high_weight: { label: 'Easy / High Weight', variant: 'success' },
  hard_low_weight: { label: 'Hard / Low Weight', variant: 'warning' },
  easy_low_weight: { label: 'Easy / Low Weight', variant: 'info' }
};

export function EisenhowerBadge({ value }) {
  if (!value) return null;
  const config = EISENHOWER_LABELS[value];
  if (!config) return null;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function Badge({ children, variant = 'default', className = '' }) {
  const colors = VARIANTS[variant] || VARIANTS.default;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ background: colors.bg, color: colors.text }}
    >
      {children}
    </span>
  );
}
